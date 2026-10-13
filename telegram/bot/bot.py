import os
import sys
import json
import html
import shutil
import asyncio
import sqlite3
import logging
import subprocess

from pathlib import Path
from typing import Any

from dotenv import load_dotenv


# ============================================================
# ENV
# ============================================================

load_dotenv()


# ============================================================
# TELEGRAM
# ============================================================

from telegram import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    Update,
)

from telegram.error import BadRequest

from telegram.ext import (
    Application,
    CallbackQueryHandler,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    filters,
)

from telegram.request import HTTPXRequest


# ============================================================
# REPAIR NOTIFIER
# ============================================================

from repair_notifier import (
    check_new_repairs,
    close_repair_view,
    handle_repair_status,
    initialize_repair_notifier,
    show_repairs_dashboard,
    show_repairs_list,
    show_repair,
    show_repair_statistics,
)


# ============================================================
# LOGGING
# ============================================================

logging.basicConfig(
    level=logging.INFO,
    format=(
        "%(asctime)s | "
        "%(levelname)s | "
        "%(name)s | "
        "%(message)s"
    ),
)

logger = logging.getLogger("TECHSTORE")


# ============================================================
# ENV SETTINGS
# ============================================================

BOT_TOKEN = os.getenv(
    "TELEGRAM_BOT_TOKEN",
    "",
).strip()

TECHSTORE_URL = os.getenv(
    "TECHSTORE_URL",
    "http://localhost:3000",
).rstrip("/")

TELEGRAM_BOT_SECRET = os.getenv(
    "TELEGRAM_BOT_SECRET",
    "",
).strip()

ADMIN_CHAT_ID_RAW = os.getenv(
    "TELEGRAM_ADMIN_CHAT_ID",
    "",
).strip()

try:
    ADMIN_CHAT_ID = (
        int(ADMIN_CHAT_ID_RAW)
        if ADMIN_CHAT_ID_RAW
        else 0
    )
except ValueError:
    ADMIN_CHAT_ID = 0


# ============================================================
# TELEGRAM ORDER STATUSES
# ============================================================

TELEGRAM_STATUS_BUTTONS = [
    "Новый",
    "В обработке",
    "Отправлен",
    "Завершён",
    "Отменён",
]


STATUS_ICONS = {
    "Новый": "🆕",
    "Подтверждён": "👍",
    "В обработке": "⚙️",
    "Готов": "📦",
    "Отправлен": "🚚",
    "Выдан": "🤝",
    "Завершён": "✅",
    "Отменён": "❌",
}


COMPLETED_STATUSES = {
    "Завершён",
    "Выдан",
}


# ============================================================
# PATHS
# ============================================================

PROJECT_DIR = (
    Path(__file__)
    .resolve()
    .parents[2]
)

TELEGRAM_DIR = (
    PROJECT_DIR
    / "telegram"
)

BOT_DIR = (
    TELEGRAM_DIR
    / "bot"
)

BOT_DATA_DIR = (
    BOT_DIR
    / "data"
)

BOT_DATA_DIR.mkdir(
    parents=True,
    exist_ok=True,
)

IMPORT_DIR = (
    TELEGRAM_DIR
    / "imports"
)

IMPORTER_DIR = (
    TELEGRAM_DIR
    / "importer"
)

PIPELINE_MAIN = (
    IMPORTER_DIR
    / "main.py"
)

PIPELINE_MEDIA_DIR = (
    IMPORTER_DIR
    / "media"
)

PIPELINE_VIDEO = (
    PIPELINE_MEDIA_DIR
    / "story.mp4"
)

IMPORT_RESULT_FILE = (
    IMPORTER_DIR
    / "output"
    / "import_result.json"
)

PIPELINE_RESULT_FILE = (
    IMPORTER_DIR
    / "output"
    / "pipeline_result.json"
)

BOT_STATE_DB = (
    BOT_DATA_DIR
    / "bot_state.sqlite3"
)


# ============================================================
# PIPELINE LOCK
# ============================================================

PIPELINE_LOCK = asyncio.Lock()


# ============================================================
# HELPERS
# ============================================================

def escape(
    value: Any,
) -> str:

    return html.escape(
        str(value)
    )


def clean_text(
    value: Any,
    default: str = "—",
) -> str:

    if value is None:
        return default

    text = str(
        value
    ).strip()

    if not text:
        return default

    return text


def format_price(
    value: Any,
) -> str:

    try:
        number = int(
            value or 0
        )
    except (
        TypeError,
        ValueError,
    ):
        number = 0

    return f"{number:,}".replace(
        ",",
        " ",
    )


def read_json(
    path: Path,
) -> dict[str, Any] | None:

    if not path.exists():
        return None

    try:
        with path.open(
            "r",
            encoding="utf-8",
        ) as file:

            data = json.load(
                file
            )

        if isinstance(
            data,
            dict,
        ):
            return data

        return None

    except Exception as error:

        logger.error(
            "Ошибка чтения JSON %s: %s",
            path,
            error,
        )

        return None


def order_id(
    order: dict[str, Any],
) -> int:

    try:
        return int(
            order.get(
                "id",
                0,
            )
        )
    except (
        TypeError,
        ValueError,
    ):
        return 0


# ============================================================
# HTTP API
# ============================================================

async def api_request(
    method: str,
    endpoint: str,
    *,
    json_data: dict[str, Any] | None = None,
    timeout: int = 20,
) -> tuple[int, Any]:

    import urllib.request
    import urllib.error

    url = (
        TECHSTORE_URL
        + endpoint
    )

    def request_sync():

        data = None

        if json_data is not None:

            data = json.dumps(
                json_data,
                ensure_ascii=False,
            ).encode(
                "utf-8"
            )

        request = (
            urllib.request.Request(
                url=url,
                data=data,
                method=method.upper(),
            )
        )

        request.add_header(
            "Content-Type",
            "application/json",
        )

        if TELEGRAM_BOT_SECRET:

            request.add_header(
                "x-telegram-secret",
                TELEGRAM_BOT_SECRET,
            )

        try:

            with urllib.request.urlopen(
                request,
                timeout=timeout,
            ) as response:

                raw = response.read()

                if not raw:

                    return (
                        response.status,
                        None,
                    )

                try:

                    result = json.loads(
                        raw.decode(
                            "utf-8"
                        )
                    )

                except Exception:

                    result = raw.decode(
                        "utf-8",
                        errors="replace",
                    )

                return (
                    response.status,
                    result,
                )

        except urllib.error.HTTPError as error:

            raw = error.read()

            try:

                result = json.loads(
                    raw.decode(
                        "utf-8"
                    )
                )

            except Exception:

                result = raw.decode(
                    "utf-8",
                    errors="replace",
                )

            return (
                error.code,
                result,
            )

        except Exception as error:

            logger.error(
                "API %s %s: %s",
                method,
                url,
                error,
            )

            raise

    return await asyncio.to_thread(
        request_sync
    )


# ============================================================
# AUTH
# ============================================================

async def require_admin(
    update: Update,
) -> bool:

    user = update.effective_user

    if not user:
        return False

    if not ADMIN_CHAT_ID:

        logger.error(
            "TELEGRAM_ADMIN_CHAT_ID "
            "не настроен."
        )

        return False

    if int(user.id) != int(
        ADMIN_CHAT_ID
    ):

        if update.callback_query:

            try:

                await update.callback_query.answer(
                    "⛔ Нет доступа",
                    show_alert=True,
                )

            except Exception:
                pass

        elif update.message:

            await update.message.reply_text(
                "⛔ У вас нет доступа."
            )

        logger.warning(
            "Попытка доступа "
            "неавторизованного пользователя: %s",
            user.id,
        )

        return False

    return True


# ============================================================
# SQLITE ARCHIVE
# ============================================================

def init_bot_database() -> None:

    connection = sqlite3.connect(
        BOT_STATE_DB
    )

    try:

        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS
            archived_orders (
                order_id INTEGER PRIMARY KEY,
                archived_at
                TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )

        connection.commit()

    finally:

        connection.close()


async def is_order_archived(
    current_order_id: int,
) -> bool:

    def check():

        connection = sqlite3.connect(
            BOT_STATE_DB
        )

        try:

            cursor = connection.execute(
                """
                SELECT order_id
                FROM archived_orders
                WHERE order_id = ?
                """,
                (
                    current_order_id,
                ),
            )

            return (
                cursor.fetchone()
                is not None
            )

        finally:

            connection.close()

    return await asyncio.to_thread(
        check
    )


async def archive_order_local(
    current_order_id: int,
) -> None:

    def save():

        connection = sqlite3.connect(
            BOT_STATE_DB
        )

        try:

            connection.execute(
                """
                INSERT OR IGNORE INTO
                archived_orders
                (order_id)
                VALUES (?)
                """,
                (
                    current_order_id,
                ),
            )

            connection.commit()

        finally:

            connection.close()

    await asyncio.to_thread(
        save
    )


async def restore_order_local(
    current_order_id: int,
) -> None:

    def restore():

        connection = sqlite3.connect(
            BOT_STATE_DB
        )

        try:

            connection.execute(
                """
                DELETE FROM archived_orders
                WHERE order_id = ?
                """,
                (
                    current_order_id,
                ),
            )

            connection.commit()

        finally:

            connection.close()

    await asyncio.to_thread(
        restore
    )


async def get_archived_ids() -> set[int]:

    def load():

        connection = sqlite3.connect(
            BOT_STATE_DB
        )

        try:

            rows = connection.execute(
                """
                SELECT order_id
                FROM archived_orders
                """
            ).fetchall()

            return {
                int(row[0])
                for row in rows
            }

        finally:

            connection.close()

    return await asyncio.to_thread(
        load
    )


async def get_archive_count() -> int:

    ids = await get_archived_ids()

    return len(ids)


# ============================================================
# ORDERS API
# ============================================================

async def get_orders() -> list[dict[str, Any]]:

    status_code, data = (
        await api_request(
            "GET",
            "/api/admin/orders",
        )
    )

    if status_code != 200:

        logger.error(
            "GET /api/admin/orders -> "
            "HTTP %s: %s",
            status_code,
            data,
        )

        return []

    if not isinstance(
        data,
        list,
    ):

        logger.error(
            "API заказов вернул "
            "не список: %r",
            data,
        )

        return []

    return [
        item
        for item in data
        if isinstance(
            item,
            dict,
        )
    ]


async def get_order(
    current_order_id: int,
) -> dict[str, Any] | None:

    orders = await get_orders()

    for order in orders:

        if (
            order_id(order)
            == current_order_id
        ):
            return order

    return None


# ============================================================
# ORDER STATUS
# ============================================================

async def update_order_status(
    current_order_id: int,
    status: str,
) -> tuple[bool, Any]:

    status_code, result = (
        await api_request(
            "PATCH",
            "/api/admin/orders",
            json_data={
                "orderId": current_order_id,
                "status": status,
            },
        )
    )

    return (
        status_code == 200,
        result,
    )


# ============================================================
# ORDER TEXT
# ============================================================

def order_status_icon(
    status: str,
) -> str:

    return STATUS_ICONS.get(
        status,
        "📌",
    )


def order_customer_name(
    order: dict[str, Any],
) -> str:

    return clean_text(
        order.get(
            "customerName"
        )
    )


def order_card_text(
    order: dict[str, Any],
    archived: bool = False,
) -> str:

    current_id = order_id(
        order
    )

    customer = clean_text(
        order.get(
            "customerName"
        )
    )

    phone = clean_text(
        order.get(
            "phone"
        )
    )

    city = clean_text(
        order.get(
            "city"
        )
    )

    address = clean_text(
        order.get(
            "address"
        )
    )

    contact = clean_text(
        order.get(
            "contactMethod"
        )
    )

    comment = clean_text(
        order.get(
            "comment"
        ),
        "",
    )

    status = clean_text(
        order.get(
            "status"
        ),
        "Новый",
    )

    total = format_price(
        order.get(
            "total",
            0,
        )
    )

    items = (
        order.get(
            "items"
        )
        or []
    )

    lines = [
        "📦 <b>ЗАКАЗ TECHSTORE</b>",
        "",
        "━━━━━━━━━━━━━━━━━━",
        "",
        f"🆔 <b>Заказ #{current_id}</b>",
        "",
        "👤 <b>КЛИЕНТ</b>",
        escape(customer),
        f"📞 {escape(phone)}",
        f"💬 Связь: {escape(contact)}",
        "",
        "📍 <b>ДОСТАВКА</b>",
        f"Город: {escape(city)}",
        f"Адрес: {escape(address)}",
        "",
        "🛒 <b>ТОВАРЫ</b>",
    ]

    if items:

        for item in items:

            if not isinstance(
                item,
                dict,
            ):
                continue

            product_name = clean_text(
                item.get(
                    "productName"
                )
            )

            price = format_price(
                item.get(
                    "price",
                    0,
                )
            )

            try:
                quantity = int(
                    item.get(
                        "quantity",
                        1,
                    )
                    or 1
                )
            except (
                TypeError,
                ValueError,
            ):
                quantity = 1

            lines.append(
                f"• {escape(product_name)}"
                f" × {quantity}"
                f" — {price} ₽"
            )

    else:

        lines.append(
            "• Товары не указаны"
        )

    lines.extend(
        [
            "",
            "━━━━━━━━━━━━━━━━━━",
            "",
            f"💰 <b>ИТОГО:</b> {total} ₽",
            "",
            f"{order_status_icon(status)} "
            f"<b>Статус:</b> "
            f"{escape(status)}",
        ]
    )

    if comment:

        lines.extend(
            [
                "",
                "💬 <b>Комментарий</b>",
                escape(comment),
            ]
        )

    if archived:

        lines.extend(
            [
                "",
                "🗄 <b>Архив Telegram</b>",
            ]
        )

    return "\n".join(
        lines
    )


# ============================================================
# ORDER KEYBOARD
# ============================================================

def build_order_keyboard(
    order: dict[str, Any],
    archived: bool = False,
    filter_key: str = "all",
    page: int = 0,
) -> InlineKeyboardMarkup:

    current_id = order_id(
        order
    )

    status = clean_text(
        order.get(
            "status"
        ),
        "Новый",
    )

    buttons = []

    if not archived:

        row = []

        for item_status in (
            TELEGRAM_STATUS_BUTTONS
        ):

            icon = STATUS_ICONS.get(
                item_status,
                "📌",
            )

            if item_status == status:

                label = (
                    f"☑️ {item_status}"
                )

            else:

                label = (
                    f"{icon} "
                    f"{item_status}"
                )

            row.append(
                InlineKeyboardButton(
                    label,
                    callback_data=(
                        "order_status:"
                        f"{current_id}:"
                        f"{item_status}"
                    ),
                )
            )

            if len(row) == 2:

                buttons.append(row)
                row = []

        if row:
            buttons.append(row)

        buttons.append(
            [
                InlineKeyboardButton(
                    "🗄 Архивировать",
                    callback_data=(
                        f"order:archive:"
                        f"{current_id}:"
                        f"{filter_key}:"
                        f"{page}"
                    ),
                )
            ]
        )
    else:

        buttons.append(
            [
                InlineKeyboardButton(
                    "♻️ Вернуть в заказы",
                    callback_data=(
                        f"order:restore:"
                        f"{current_id}:"
                        f"{filter_key}:"
                        f"{page}"
                    ),
                )
            ]
        )

    buttons.append(
        [
            InlineKeyboardButton(
                "◀️ К списку",
                callback_data=(
                    f"orders:list:"
                    f"{filter_key}:"
                    f"{page}"
                ),
            ),
            InlineKeyboardButton(
                "🏠 Главное",
                callback_data="menu:home",
            ),
        ]
    )

    return InlineKeyboardMarkup(
        buttons
    )


# ============================================================
# ORDERS DASHBOARD
# ============================================================

def get_order_counts(
    orders: list[dict[str, Any]],
    archived_ids: set[int],
) -> dict[str, int]:

    counts = {
        "all": 0,
        "Новый": 0,
        "В обработке": 0,
        "Отправлен": 0,
        "Завершён": 0,
        "Отменён": 0,
        "archived": len(
            archived_ids
        ),
    }

    for order in orders:

        current_id = order_id(
            order
        )

        if current_id in archived_ids:
            continue

        counts["all"] += 1

        status = clean_text(
            order.get(
                "status"
            ),
            "Новый",
        )

        if status in counts:
            counts[status] += 1

    return counts


async def show_orders_dashboard(
    update: Update,
) -> None:

    query = update.callback_query

    orders = await get_orders()

    archived_ids = (
        await get_archived_ids()
    )

    counts = get_order_counts(
        orders,
        archived_ids,
    )

    text = (
        "📦 <b>ЗАКАЗЫ TECHSTORE</b>\n\n"
        "━━━━━━━━━━━━━━━━━━\n\n"
        f"📋 Все активные: "
        f"<b>{counts['all']}</b>\n\n"
        f"🆕 Новые: "
        f"<b>{counts['Новый']}</b>\n"
        f"⚙️ В обработке: "
        f"<b>{counts['В обработке']}</b>\n"
        f"🚚 Отправлены: "
        f"<b>{counts['Отправлен']}</b>\n"
        f"✅ Завершены: "
        f"<b>{counts['Завершён']}</b>\n"
        f"❌ Отменены: "
        f"<b>{counts['Отменён']}</b>\n"
        f"🗄 Архив Telegram: "
        f"<b>{counts['archived']}</b>\n\n"
        "━━━━━━━━━━━━━━━━━━\n\n"
        "Выберите раздел:"
    )

    keyboard = InlineKeyboardMarkup(
        [
            [
                InlineKeyboardButton(
                    f"📋 Все ({counts['all']})",
                    callback_data="orders:list:all:0",
                )
            ],
            [
                InlineKeyboardButton(
                    f"🆕 Новые ({counts['Новый']})",
                    callback_data="orders:list:Новый:0",
                ),
                InlineKeyboardButton(
                    f"⚙️ В работе ({counts['В обработке']})",
                    callback_data=(
                        "orders:list:В обработке:0"
                    ),
                ),
            ],
            [
                InlineKeyboardButton(
                    f"🚚 Отправлены ({counts['Отправлен']})",
                    callback_data=(
                        "orders:list:Отправлен:0"
                    ),
                ),
                InlineKeyboardButton(
                    f"✅ Завершены ({counts['Завершён']})",
                    callback_data=(
                        "orders:list:Завершён:0"
                    ),
                ),
            ],
            [
                InlineKeyboardButton(
                    f"❌ Отменены ({counts['Отменён']})",
                    callback_data=(
                        "orders:list:Отменён:0"
                    ),
                ),
                InlineKeyboardButton(
                    f"🗄 Архив ({counts['archived']})",
                    callback_data=(
                        "orders:list:archived:0"
                    ),
                ),
            ],
            [
                InlineKeyboardButton(
                    "🔄 Обновить",
                    callback_data="menu:orders",
                )
            ],
            [
                InlineKeyboardButton(
                    "🏠 Главное меню",
                    callback_data="menu:home",
                )
            ],
        ]
    )

    if query:

        await query.edit_message_text(
            text,
            parse_mode="HTML",
            reply_markup=keyboard,
        )


# ============================================================
# ORDER LIST
# ============================================================

async def show_orders_list(
    update: Update,
    filter_key: str,
    page: int = 0,
) -> None:

    query = update.callback_query

    orders = await get_orders()

    archived_ids = (
        await get_archived_ids()
    )

    filtered = []

    for order in orders:

        current_id = order_id(
            order
        )

        status = clean_text(
            order.get(
                "status"
            ),
            "Новый",
        )

        if filter_key == "archived":

            if current_id in archived_ids:
                filtered.append(order)

            continue

        if current_id in archived_ids:
            continue

        if filter_key == "all":

            filtered.append(order)

        elif status == filter_key:

            filtered.append(order)

    page_size = 6

    start = page * page_size
    end = start + page_size

    page_items = filtered[
        start:end
    ]

    if filter_key == "archived":

        title = "🗄 <b>АРХИВ</b>"

    elif filter_key == "all":

        title = "📋 <b>ВСЕ ЗАКАЗЫ</b>"

    else:

        title = (
            f"{order_status_icon(filter_key)} "
            f"<b>{escape(filter_key.upper())}</b>"
        )

    lines = [
        title,
        "",
        f"Заказов: <b>{len(filtered)}</b>",
        "",
    ]

    if not page_items:

        lines.append(
            "Здесь пока нет заказов."
        )

    else:

        for order in page_items:

            current_id = order_id(
                order
            )

            customer = (
                order_customer_name(
                    order
                )
            )

            status = clean_text(
                order.get(
                    "status"
                ),
                "Новый",
            )

            total = format_price(
                order.get(
                    "total",
                    0,
                )
            )

            icon = (
                order_status_icon(
                    status
                )
            )

            lines.append(
                f"{icon} "
                f"<b>#{current_id}</b> "
                f"{escape(customer)}"
            )

            lines.append(
                f"   💰 {total} ₽"
            )

            lines.append("")

    buttons = []

    for order in page_items:

        current_id = order_id(
            order
        )

        customer = (
            order_customer_name(
                order
            )
        )

        if len(customer) > 30:

            customer = (
                customer[:27]
                + "..."
            )

        buttons.append(
            [
                InlineKeyboardButton(
                    f"#{current_id} • {customer}",
                    callback_data=(
                        f"order:view:"
                        f"{current_id}:"
                        f"{filter_key}:"
                        f"{page}"
                    ),
                )
            ]
        )

    pagination = []

    if page > 0:

        pagination.append(
            InlineKeyboardButton(
                "⬅️",
                callback_data=(
                    f"orders:list:"
                    f"{filter_key}:"
                    f"{page - 1}"
                ),
            )
        )

    if end < len(filtered):

        pagination.append(
            InlineKeyboardButton(
                "➡️",
                callback_data=(
                    f"orders:list:"
                    f"{filter_key}:"
                    f"{page + 1}"
                ),
            )
        )

    if pagination:
        buttons.append(pagination)

    buttons.append(
        [
            InlineKeyboardButton(
                "◀️ Заказы",
                callback_data="menu:orders",
            )
        ]
    )

    buttons.append(
        [
            InlineKeyboardButton(
                "🏠 Главное",
                callback_data="menu:home",
            )
        ]
    )

    if query:

        await query.edit_message_text(
            "\n".join(lines),
            parse_mode="HTML",
            reply_markup=InlineKeyboardMarkup(
                buttons
            ),
        )


# ============================================================
# ORDER VIEW
# ============================================================

async def show_order(
    update: Update,
    current_order_id: int,
    filter_key: str = "all",
    page: int = 0,
) -> None:

    query = update.callback_query

    order = await get_order(
        current_order_id
    )

    if not order:

        if query:

            await query.edit_message_text(
                "❌ <b>Заказ не найден</b>",
                parse_mode="HTML",
                reply_markup=InlineKeyboardMarkup(
                    [
                        [
                            InlineKeyboardButton(
                                "◀️ К заказам",
                                callback_data=(
                                    "menu:orders"
                                ),
                            )
                        ]
                    ]
                ),
            )

        return

    archived = await is_order_archived(
        current_order_id
    )

    if query:

        await query.edit_message_text(
            order_card_text(
                order,
                archived,
            ),
            parse_mode="HTML",
            reply_markup=build_order_keyboard(
                order,
                archived,
                filter_key,
                page,
            ),
        )


# ============================================================
# ORDER STATUS CALLBACK
# ============================================================

async def handle_order_status(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
) -> None:

    query = update.callback_query

    if not query:
        return

    if not await require_admin(update):
        return

    data = query.data or ""

    parts = data.split(
        ":",
        2,
    )

    if len(parts) != 3:

        await query.answer(
            "Некорректная команда",
            show_alert=True,
        )

        return

    try:

        current_order_id = int(
            parts[1]
        )

    except ValueError:

        await query.answer(
            "Некорректный ID заказа",
            show_alert=True,
        )

        return

    status = parts[2].strip()

    if status not in TELEGRAM_STATUS_BUTTONS:

        await query.answer(
            "Недопустимый статус",
            show_alert=True,
        )

        return

    success, result = (
        await update_order_status(
            current_order_id,
            status,
        )
    )

    if not success:

        logger.error(
            "Не удалось изменить "
            "статус заказа #%s: %s",
            current_order_id,
            result,
        )

        await query.answer(
            "Не удалось изменить статус",
            show_alert=True,
        )

        return

    await query.answer(
        f"{STATUS_ICONS.get(status, '📌')} "
        f"{status}"
    )

    order = await get_order(
        current_order_id
    )

    if not order:

        await query.edit_message_text(
            "⚠️ Заказ обновлён, "
            "но не найден в API."
        )

        return

    await query.edit_message_text(
        order_card_text(
            order,
            False,
        ),
        parse_mode="HTML",
        reply_markup=build_order_keyboard(
            order,
            False,
            "all",
            0,
        ),
    )


# ============================================================
# ARCHIVE REQUEST
# ============================================================

async def handle_archive_request(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
) -> None:

    query = update.callback_query

    if not query:
        return

    if not await require_admin(update):
        return

    parts = (
        query.data or ""
    ).split(":")

    if len(parts) < 3:

        await query.answer(
            "Некорректная команда",
            show_alert=True,
        )

        return

    try:

        current_order_id = int(
            parts[2]
        )

    except ValueError:

        await query.answer(
            "Некорректный ID",
            show_alert=True,
        )

        return

    filter_key = (
        parts[3]
        if len(parts) > 3
        else "all"
    )

    try:

        page = (
            int(parts[4])
            if len(parts) > 4
            else 0
        )

    except ValueError:

        page = 0

    order = await get_order(
        current_order_id
    )

    if not order:

        await query.answer(
            "Заказ не найден",
            show_alert=True,
        )

        return

    status = clean_text(
        order.get(
            "status"
        ),
        "Новый",
    )

    if status not in COMPLETED_STATUSES:

        await query.answer(
            "Архивировать можно только "
            "выполненный заказ",
            show_alert=True,
        )

        return

    await query.edit_message_text(
        (
            "🗄 <b>АРХИВИРОВАТЬ ЗАКАЗ?</b>\n\n"
            f"Заказ: <b>#{current_order_id}</b>\n"
            f"Клиент: "
            f"<b>{escape(order_customer_name(order))}</b>\n\n"
            "Заказ исчезнет из активного "
            "списка Telegram.\n\n"
            "Он останется в базе сайта."
        ),
        parse_mode="HTML",
        reply_markup=InlineKeyboardMarkup(
            [
                [
                    InlineKeyboardButton(
                        "🗄 Да, архивировать",
                        callback_data=(
                            f"order:archive_confirm:"
                            f"{current_order_id}:"
                            f"{filter_key}:"
                            f"{page}"
                        ),
                    )
                ],
                [
                    InlineKeyboardButton(
                        "◀️ Отмена",
                        callback_data=(
                            f"order:view:"
                            f"{current_order_id}:"
                            f"{filter_key}:"
                            f"{page}"
                        ),
                    )
                ],
            ]
        ),
    )


# ============================================================
# ARCHIVE CONFIRM
# ============================================================

async def handle_archive_confirm(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
) -> None:

    query = update.callback_query

    if not query:
        return

    if not await require_admin(update):
        return

    parts = (
        query.data or ""
    ).split(":")

    if len(parts) < 3:

        await query.answer(
            "Некорректная команда",
            show_alert=True,
        )

        return

    try:

        current_order_id = int(
            parts[2]
        )

    except ValueError:

        await query.answer(
            "Некорректный ID",
            show_alert=True,
        )

        return

    await archive_order_local(
        current_order_id
    )

    await query.answer(
        "🗄 Заказ архивирован"
    )

    await query.edit_message_text(
        (
            "🗄 <b>ЗАКАЗ АРХИВИРОВАН</b>\n\n"
            f"Заказ <b>#{current_order_id}</b> "
            "скрыт из активного Telegram."
        ),
        parse_mode="HTML",
        reply_markup=InlineKeyboardMarkup(
            [
                [
                    InlineKeyboardButton(
                        "📦 Заказы",
                        callback_data="menu:orders",
                    )
                ],
                [
                    InlineKeyboardButton(
                        "🗄 Архив",
                        callback_data=(
                            "orders:list:archived:0"
                        ),
                    )
                ],
                [
                    InlineKeyboardButton(
                        "🏠 Главное",
                        callback_data="menu:home",
                    )
                ],
            ]
        ),
    )


# ============================================================
# MAIN MENU
# ============================================================

def build_main_menu() -> InlineKeyboardMarkup:

    return InlineKeyboardMarkup(
        [
            [
                InlineKeyboardButton(
                    "📦 Заказы",
                    callback_data="menu:orders",
                ),
                InlineKeyboardButton(
                    "🔧 Ремонты",
                    callback_data="menu:repairs",
                ),
            ],
            [
                InlineKeyboardButton(
                    "📊 Статистика",
                    callback_data="menu:stats",
                ),
                InlineKeyboardButton(
                    "📥 Импорт",
                    callback_data="menu:import",
                ),
            ],
            [
                InlineKeyboardButton(
                    "⚙️ Система",
                    callback_data="menu:system",
                ),
                InlineKeyboardButton(
                    "🔄 Обновить",
                    callback_data="menu:refresh",
                ),
            ],
        ]
    )


async def show_main_menu(
    update: Update,
    *,
    edit: bool = False,
) -> None:

    text = (
        "🟢 <b>TECHSTORE ADMIN</b>\n\n"
        "━━━━━━━━━━━━━━━━━━\n\n"
        "Добро пожаловать "
        "в панель управления.\n\n"
        "Выберите раздел:"
    )

    query = update.callback_query

    if edit and query:

        await query.edit_message_text(
            text,
            parse_mode="HTML",
            reply_markup=build_main_menu(),
        )

        return

    if update.message:

        await update.message.reply_text(
            text,
            parse_mode="HTML",
            reply_markup=build_main_menu(),
        )


# ============================================================
# COMMANDS
# ============================================================

async def start_command(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
):

    if not await require_admin(update):
        return

    await show_main_menu(
        update,
        edit=False,
    )


async def menu_command(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
):

    if not await require_admin(update):
        return

    await show_main_menu(
        update,
        edit=False,
    )


async def orders_command(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
):

    if not await require_admin(update):
        return

    if update.message:

        await update.message.reply_text(
            "📦 <b>Заказы</b>\n\n"
            "Открываю панель заказов...",
            parse_mode="HTML",
        )

    orders = await get_orders()

    archived_ids = (
        await get_archived_ids()
    )

    counts = get_order_counts(
        orders,
        archived_ids,
    )

    if update.message:

        await update.message.reply_text(
            (
                "📦 <b>ЗАКАЗЫ TECHSTORE</b>\n\n"
                f"📋 Активных: "
                f"<b>{counts['all']}</b>\n"
                f"🆕 Новых: "
                f"<b>{counts['Новый']}</b>\n"
                f"⚙️ В обработке: "
                f"<b>{counts['В обработке']}</b>\n"
                f"🚚 Отправлены: "
                f"<b>{counts['Отправлен']}</b>\n"
                f"✅ Завершены: "
                f"<b>{counts['Завершён']}</b>\n"
                f"❌ Отменены: "
                f"<b>{counts['Отменён']}</b>"
            ),
            parse_mode="HTML",
            reply_markup=InlineKeyboardMarkup(
                [
                    [
                        InlineKeyboardButton(
                            "📦 Открыть заказы",
                            callback_data="menu:orders",
                        )
                    ],
                    [
                        InlineKeyboardButton(
                            "🏠 Главное",
                            callback_data="menu:home",
                        )
                    ],
                ]
            ),
        )


async def stats_command(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
):

    if not await require_admin(update):
        return

    await send_statistics(update)

# ============================================================
# STATISTICS
# ============================================================

async def statistics_text() -> str:

    orders = await get_orders()

    archived_ids = (
        await get_archived_ids()
    )

    active_orders = [
        order
        for order in orders
        if order_id(order) not in archived_ids
    ]

    total_orders = len(
        active_orders
    )

    total_revenue = 0

    for order in active_orders:

        try:

            total_revenue += int(
                order.get(
                    "total",
                    0,
                )
                or 0
            )

        except (
            TypeError,
            ValueError,
        ):

            pass

    status_counts = {
        "Новый": 0,
        "В обработке": 0,
        "Отправлен": 0,
        "Завершён": 0,
        "Отменён": 0,
    }

    for order in active_orders:

        status = clean_text(
            order.get(
                "status"
            ),
            "Новый",
        )

        if status in status_counts:

            status_counts[status] += 1

    archive_count = len(
        archived_ids
    )

    return (
        "📊 <b>СТАТИСТИКА TECHSTORE</b>\n\n"
        "━━━━━━━━━━━━━━━━━━\n\n"
        f"📦 Активных заказов: "
        f"<b>{total_orders}</b>\n\n"
        f"💰 Сумма заказов: "
        f"<b>{format_price(total_revenue)} ₽</b>\n\n"
        "📌 <b>ПО СТАТУСАМ</b>\n"
        f"🆕 Новые: "
        f"<b>{status_counts['Новый']}</b>\n"
        f"⚙️ В обработке: "
        f"<b>{status_counts['В обработке']}</b>\n"
        f"🚚 Отправлены: "
        f"<b>{status_counts['Отправлен']}</b>\n"
        f"✅ Завершены: "
        f"<b>{status_counts['Завершён']}</b>\n"
        f"❌ Отменены: "
        f"<b>{status_counts['Отменён']}</b>\n\n"
        f"🗄 В архиве Telegram: "
        f"<b>{archive_count}</b>\n\n"
        "━━━━━━━━━━━━━━━━━━"
    )


async def show_statistics(
    update: Update,
) -> None:

    query = update.callback_query

    text = await statistics_text()

    keyboard = InlineKeyboardMarkup(
        [
            [
                InlineKeyboardButton(
                    "🔄 Обновить",
                    callback_data="menu:stats",
                )
            ],
            [
                InlineKeyboardButton(
                    "🏠 Главное",
                    callback_data="menu:home",
                )
            ],
        ]
    )

    if query:

        await query.edit_message_text(
            text,
            parse_mode="HTML",
            reply_markup=keyboard,
        )

    elif update.message:

        await update.message.reply_text(
            text,
            parse_mode="HTML",
            reply_markup=keyboard,
        )


async def send_statistics(
    update: Update,
) -> None:

    await show_statistics(
        update
    )


# ============================================================
# SYSTEM
# ============================================================

async def show_system(
    update: Update,
) -> None:

    query = update.callback_query

    bot_status = (
        "🟢 Работает"
        if BOT_TOKEN
        else "🔴 Не настроен"
    )

    api_status = "⚪ Проверка..."

    try:

        status_code, data = (
            await api_request(
                "GET",
                "/api/admin/orders",
                timeout=5,
            )
        )

        if status_code == 200:

            api_status = "🟢 Доступен"

        else:

            api_status = (
                f"🔴 HTTP {status_code}"
            )

    except Exception as error:

        logger.error(
            "Ошибка проверки API: %s",
            error,
        )

        api_status = "🔴 Недоступен"

    database_status = (
        "🟢 Готова"
        if BOT_STATE_DB.exists()
        else "🟡 Будет создана"
    )

    pipeline_status = (
        "🟢 Найден"
        if PIPELINE_MAIN.exists()
        else "🔴 Не найден"
    )

    text = (
        "⚙️ <b>СИСТЕМА TECHSTORE</b>\n\n"
        "━━━━━━━━━━━━━━━━━━\n\n"
        f"🤖 Telegram Bot: "
        f"<b>{bot_status}</b>\n"
        f"🌐 API: "
        f"<b>{api_status}</b>\n"
        f"🗃 SQLite: "
        f"<b>{database_status}</b>\n"
        f"⚙️ Import Pipeline: "
        f"<b>{pipeline_status}</b>\n\n"
        f"📁 Проект:\n"
        f"<code>{escape(PROJECT_DIR)}</code>\n\n"
        f"🌐 URL:\n"
        f"<code>{escape(TECHSTORE_URL)}</code>\n\n"
        "━━━━━━━━━━━━━━━━━━"
    )

    keyboard = InlineKeyboardMarkup(
        [
            [
                InlineKeyboardButton(
                    "🔄 Проверить",
                    callback_data="menu:system",
                )
            ],
            [
                InlineKeyboardButton(
                    "🏠 Главное",
                    callback_data="menu:home",
                )
            ],
        ]
    )

    if query:

        await query.edit_message_text(
            text,
            parse_mode="HTML",
            reply_markup=keyboard,
        )

    elif update.message:

        await update.message.reply_text(
            text,
            parse_mode="HTML",
            reply_markup=keyboard,
        )


# ============================================================
# IMPORT MENU
# ============================================================


async def show_import_menu(
    update: Update,
) -> None:

    query = update.callback_query

    import_result = read_json(
        IMPORT_RESULT_FILE
    )

    pipeline_result = read_json(
        PIPELINE_RESULT_FILE
    )

    if pipeline_result:

        source_data = pipeline_result

    else:

        source_data = import_result

    if source_data:

        status = clean_text(
            source_data.get(
                "status"
            ),
            "Неизвестно",
        )

        # pipeline_result может содержать
        # данные импорта внутри importResult.
        #
        # Поэтому сначала пытаемся взять данные
        # непосредственно из результата pipeline,
        # а затем из importResult.

        import_data = source_data.get(
            "importResult"
        )

        if isinstance(import_data, dict):

            product_source = import_data

        else:

            product_source = source_data

        product_name = clean_text(
            product_source.get(
                "name"
            ),
            "Не определён",
        )

        price = product_source.get(
            "price"
        )

        if price is not None:

            price_text = (
                f"{format_price(price)} ₽"
            )

        else:

            price_text = "Не определена"

        text = (
            "📥 <b>ИМПОРТ</b>\n\n"
            "━━━━━━━━━━━━━━━━━━\n\n"
            f"📌 Статус: "
            f"<b>{escape(status)}</b>\n"
            f"📱 Товар: "
            f"<b>{escape(product_name)}</b>\n"
            f"💰 Цена: "
            f"<b>{price_text}</b>\n\n"
            "Последний результат обработки "
            "найден."
        )

    else:

        text = (
            "📥 <b>ИМПОРТ</b>\n\n"
            "━━━━━━━━━━━━━━━━━━\n\n"
            "Последний результат импорта "
            "не найден.\n\n"
            "Отправь видео или файл боту, "
            "чтобы запустить обработку."
        )

    keyboard = InlineKeyboardMarkup(
        [
            [
                InlineKeyboardButton(
                    "🎬 Обработать видео",
                    callback_data="menu:video",
                )
            ],
            [
                InlineKeyboardButton(
                    "🔄 Обновить",
                    callback_data="menu:import",
                )
            ],
            [
                InlineKeyboardButton(
                    "🏠 Главное",
                    callback_data="menu:home",
                )
            ],
        ]
    )

    # ========================================================
    # CALLBACK QUERY
    # ========================================================

    if query:

        try:

            await query.answer()

        except Exception:

            pass

        try:

            await query.edit_message_text(
                text,
                parse_mode="HTML",
                reply_markup=keyboard,
            )

        except Exception as error:

            error_text = str(error)

            # Telegram возвращает эту ошибку,
            # если текст и кнопки уже абсолютно
            # такие же, как в текущем сообщении.
            if (
                "Message is not modified"
                in error_text
            ):
                return

            # Все остальные ошибки не скрываем.
            raise

        return

    # ========================================================
    # ОБЫЧНОЕ СООБЩЕНИЕ
    # ========================================================

    if update.message:

        await update.message.reply_text(
            text,
            parse_mode="HTML",
            reply_markup=keyboard,
        )

# ============================================================
# VIDEO INFO
# ============================================================

async def show_video_info(
    update: Update,
) -> None:

    query = update.callback_query

    video_exists = (
        PIPELINE_VIDEO.exists()
    )

    video_size = 0

    if video_exists:

        try:

            video_size = (
                PIPELINE_VIDEO.stat().st_size
                / 1024
                / 1024
            )

        except Exception:

            video_size = 0

    if video_exists:

        text = (
            "🎬 <b>ВИДЕО PIPELINE</b>\n\n"
            "━━━━━━━━━━━━━━━━━━\n\n"
            f"📹 Файл: "
            f"<b>{PIPELINE_VIDEO.name}</b>\n"
            f"💾 Размер: "
            f"<b>{video_size:.2f} MB</b>\n"
            "🟢 Видео готово к обработке."
        )

    else:

        text = (
            "🎬 <b>ВИДЕО PIPELINE</b>\n\n"
            "━━━━━━━━━━━━━━━━━━\n\n"
            "🔴 Видео не найдено.\n\n"
            "Отправь видео боту, "
            "чтобы сохранить его "
            "в pipeline."
        )

    keyboard = InlineKeyboardMarkup(
        [
            [
                InlineKeyboardButton(
                    "▶️ Запустить Pipeline",
                    callback_data="menu:video",
                )
            ],
            [
                InlineKeyboardButton(
                    "📥 Импорт",
                    callback_data="menu:import",
                ),
                InlineKeyboardButton(
                    "🏠 Главное",
                    callback_data="menu:home",
                ),
            ],
        ]
    )

    if query:

        await query.edit_message_text(
            text,
            parse_mode="HTML",
            reply_markup=keyboard,
        )

    elif update.message:

        await update.message.reply_text(
            text,
            parse_mode="HTML",
            reply_markup=keyboard,
        )


# ============================================================
# REPAIR MENU
# ============================================================

async def show_repairs_menu(
    update: Update,
) -> None:

    query = update.callback_query

    if query:

        await show_repairs_dashboard(
            update,
            edit=True,
        )

    else:

        await show_repairs_dashboard(
            update,
            edit=False,
        )


# ============================================================
# CALLBACK ROUTER
# ============================================================

async def handle_menu_callback(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
) -> None:

    query = update.callback_query

    if not query:

        return

    if not await require_admin(
        update
    ):

        return

    data = query.data or ""

    # ========================================================
    # HOME
    # ========================================================

    if data == "menu:home":

        await query.answer()

        await show_main_menu(
            update,
            edit=True,
        )

        return

    # ========================================================
    # ORDERS
    # ========================================================

    if data == "menu:orders":

        await query.answer()

        await show_orders_dashboard(
            update
        )

        return

    # ========================================================
    # ORDER LIST
    # ========================================================

    if data.startswith(
        "orders:list:"
    ):

        await query.answer()

        parts = data.split(
            ":"
        )

        if len(parts) < 4:

            await query.edit_message_text(
                "❌ Некорректный список заказов."
            )

            return

        filter_key = parts[2]

        try:

            page = int(
                parts[3]
            )

        except ValueError:

            page = 0

        await show_orders_list(
            update,
            filter_key,
            page,
        )

        return

    # ========================================================
    # ORDER VIEW
    # ========================================================

    if data.startswith(
        "order:view:"
    ):

        await query.answer()

        parts = data.split(
            ":"
        )

        if len(parts) < 3:

            await query.edit_message_text(
                "❌ Некорректный ID заказа."
            )

            return

        try:

            current_order_id = int(
                parts[2]
            )

        except ValueError:

            await query.edit_message_text(
                "❌ Некорректный ID заказа."
            )

            return

        filter_key = (
            parts[3]
            if len(parts) > 3
            else "all"
        )

        try:

            page = (
                int(parts[4])
                if len(parts) > 4
                else 0
            )

        except ValueError:

            page = 0

        await show_order(
            update,
            current_order_id,
            filter_key,
            page,
        )

        return

    # ========================================================
    # ORDER ARCHIVE
    # ========================================================

    if data.startswith(
        "order:archive_confirm:"
    ):

        await handle_archive_confirm(
            update,
            context,
        )

        return

    if data.startswith(
        "order:archive:"
    ):

        await handle_archive_request(
            update,
            context,
        )

        return

    # ========================================================
    # ORDER RESTORE
    # ========================================================

    if data.startswith(
        "order:restore:"
    ):

        await handle_restore_order(
            update,
            context,
        )

        return

    # ========================================================
    # REPAIRS DASHBOARD
    # ========================================================

    if data == "repairs:dashboard":

        await query.answer()

        await show_repairs_dashboard(
            update,
            edit=True,
        )

        return

    # ========================================================
    # REPAIR LIST
    # ========================================================

    if data.startswith(
        "repairs:list:"
    ):

        await query.answer()

        parts = data.split(
            ":"
        )

        if len(parts) < 3:

            await query.edit_message_text(
                "❌ Некорректный список ремонтов."
            )

            return

        status = parts[2]

        try:

            page = (
                int(parts[3])
                if len(parts) > 3
                else 0
            )

        except ValueError:

            page = 0

        await show_repairs_list(
            update,
            status,
            page,
        )

        return

    # ========================================================
    # REPAIR VIEW
    # ========================================================

    if data.startswith(
        "repair:view:"
    ):

        await query.answer()

        parts = data.split(
            ":"
        )

        if len(parts) < 3:

            await query.edit_message_text(
                "❌ Некорректный ID заявки."
            )

            return

        try:

            repair_id = int(
                parts[2]
            )

        except ValueError:

            await query.edit_message_text(
                "❌ Некорректный ID заявки."
            )

            return

        previous_status = (
            parts[3]
            if len(parts) > 3
            else "Новая"
        )

        try:

            page = (
                int(parts[4])
                if len(parts) > 4
                else 0
            )

        except ValueError:

            page = 0

        await show_repair(
            update,
            context,
            repair_id,
            previous_status,
            page,
        )

        return

    # ========================================================
    # REPAIR CLOSE
    # ========================================================

    if data.startswith(
        "repair:close:"
    ):

        parts = data.split(
            ":"
        )

        if len(parts) < 3:

            await query.answer(
                "❌ Некорректный ID",
                show_alert=True,
            )

            return

        try:

            repair_id = int(
                parts[2]
            )

        except ValueError:

            await query.answer(
                "❌ Некорректный ID",
                show_alert=True,
            )

            return

        await close_repair_view(
            update,
            context,
            repair_id,
        )

        await show_main_menu(
            update,
            edit=True,
        )

        return

    # ========================================================
    # REPAIR STATISTICS
    # ========================================================

    if data == "repairs:stats":

        await query.answer()

        await show_repair_statistics(
            update,
            edit=True,
        )

        return

    # ========================================================
    # REPAIRS MAIN MENU
    # ========================================================

    if data == "menu:repairs":

        await query.answer()

        await show_repairs_dashboard(
            update,
            edit=True,
        )

        return

    # ========================================================
    # GENERAL STATISTICS
    # ========================================================

    if data == "menu:stats":

        await query.answer()

        await show_statistics(
            update
        )

        return

    # ========================================================
    # IMPORT
    # ========================================================

    if data == "menu:import":

        await query.answer()

        await show_import_menu(
            update
        )

        return

    # ========================================================
    # VIDEO
    # ========================================================

    if data == "menu:video":

        await query.answer(
            "🎬 Проверяю pipeline..."
        )

        await process_video(
            update,
            context,
        )

        return

    # ========================================================
    # SYSTEM
    # ========================================================

    if data == "menu:system":

        await query.answer()

        await show_system(
            update
        )

        return

    # ========================================================
    # REFRESH
    # ========================================================

    if data == "menu:refresh":

        await query.answer(
            "🔄 Обновляю..."
        )

        await show_main_menu(
            update,
            edit=True,
        )

        return

    # ========================================================
    # UNKNOWN CALLBACK
    # ========================================================

    logger.warning(
        "Неизвестный callback: %s",
        data,
    )

    try:

        await query.answer(
            "⚠️ Неизвестная команда",
            show_alert=True,
        )

    except Exception:

        pass
# ============================================================
# RESTORE ORDER
# ============================================================

async def handle_restore_order(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
) -> None:

    query = update.callback_query

    if not query:
        return

    if not await require_admin(update):
        return

    parts = (
        query.data or ""
    ).split(":")

    if len(parts) < 3:

        await query.answer(
            "Некорректная команда",
            show_alert=True,
        )

        return

    try:

        current_order_id = int(
            parts[2]
        )

    except ValueError:

        await query.answer(
            "Некорректный ID заказа",
            show_alert=True,
        )

        return

    filter_key = (
        parts[3]
        if len(parts) > 3
        else "archived"
    )

    try:

        page = (
            int(parts[4])
            if len(parts) > 4
            else 0
        )

    except ValueError:

        page = 0

    archived = await is_order_archived(
        current_order_id
    )

    if not archived:

        await query.answer(
            "Заказ уже находится в активных",
            show_alert=True,
        )

        await show_order(
            update,
            current_order_id,
            filter_key,
            page,
        )

        return

    await restore_order_local(
        current_order_id
    )

    await query.answer(
        "♻️ Заказ возвращён"
    )

    order = await get_order(
        current_order_id
    )

    if not order:

        await query.edit_message_text(
            (
                "⚠️ Заказ убран из архива,\n"
                "но получить его из API "
                "не удалось."
            ),
            reply_markup=InlineKeyboardMarkup(
                [
                    [
                        InlineKeyboardButton(
                            "📦 Заказы",
                            callback_data="menu:orders",
                        )
                    ],
                    [
                        InlineKeyboardButton(
                            "🏠 Главное",
                            callback_data="menu:home",
                        )
                    ],
                ]
            ),
        )

        return

    await show_order(
        update,
        current_order_id,
        "all",
        0,
    )


# ============================================================
# PIPELINE MESSAGE
# ============================================================

def get_pipeline_message(
    result: dict[str, Any] | None,
) -> str:

    if not result:

        return (
            "⚠️ <b>Pipeline не вернул результат.</b>"
        )

    status = clean_text(
        result.get(
            "status"
        ),
        "unknown",
    )

    success = result.get(
        "success"
    )

    product_name = clean_text(
        result.get(
            "name"
        ),
        "",
    )

    brand = clean_text(
        result.get(
            "brand"
        ),
        "",
    )

    model = clean_text(
        result.get(
            "model"
        ),
        "",
    )

    category = clean_text(
        result.get(
            "category"
        ),
        "",
    )

    price = result.get(
        "price"
    )

    if price is not None:

        price_text = (
            f"{format_price(price)} ₽"
        )

    else:

        price_text = "—"

    lines = [
        "🤖 <b>PIPELINE TECHSTORE</b>",
        "",
        "━━━━━━━━━━━━━━━━━━",
        "",
        f"📌 Статус: <b>{escape(status)}</b>",
    ]

    if success is not None:

        success_text = (
            "Да"
            if success
            else "Нет"
        )

        lines.append(
            f"✅ Успешно: <b>{success_text}</b>"
        )

    if product_name:

        lines.append(
            f"📱 Товар: <b>{escape(product_name)}</b>"
        )

    if brand:

        lines.append(
            f"🏷 Бренд: <b>{escape(brand)}</b>"
        )

    if model:

        lines.append(
            f"🔖 Модель: <b>{escape(model)}</b>"
        )

    if category:

        lines.append(
            f"📂 Категория: <b>{escape(category)}</b>"
        )

    if price is not None:

        lines.append(
            f"💰 Цена: <b>{price_text}</b>"
        )

    error_message = (
        result.get(
            "error"
        )
        or result.get(
            "message"
        )
    )

    if error_message:

        lines.extend(
            [
                "",
                "❌ <b>Ошибка</b>",
                escape(error_message),
            ]
        )

    lines.extend(
        [
            "",
            "━━━━━━━━━━━━━━━━━━",
        ]
    )

    return "\n".join(
        lines
    )


# ============================================================
# RUN PIPELINE
# ============================================================

async def run_pipeline() -> dict[str, Any]:

    if not PIPELINE_MAIN.exists():

        return {
            "success": False,
            "status": "error",
            "error": (
                "Файл pipeline не найден: "
                f"{PIPELINE_MAIN}"
            ),
        }

    if not PIPELINE_VIDEO.exists():

        return {
            "success": False,
            "status": "error",
            "error": (
                "Видео не найдено: "
                f"{PIPELINE_VIDEO}"
            ),
        }

    if PIPELINE_LOCK.locked():

        return {
            "success": False,
            "status": "busy",
            "error": (
                "Pipeline уже выполняется."
            ),
        }

    async with PIPELINE_LOCK:

        logger.info(
            "Запуск pipeline: %s",
            PIPELINE_MAIN,
        )

        command = [
            sys.executable,
            "-X",
            "utf8",
            str(PIPELINE_MAIN),
        ]

        try:

            process = await asyncio.create_subprocess_exec(
                *command,
                cwd=str(IMPORTER_DIR),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.STDOUT,
            )

        except Exception as error:

            logger.exception(
                "Не удалось запустить pipeline"
            )

            return {
                "success": False,
                "status": "error",
                "error": str(error),
            }

        output_lines: list[str] = []

        if process.stdout:

            while True:

                line = await process.stdout.readline()

                if not line:
                    break

                decoded = (
                    line.decode(
                        "utf-8",
                        errors="replace",
                    )
                    .rstrip()
                )

                if decoded:

                    output_lines.append(
                        decoded
                    )

                    logger.info(
                        "[PIPELINE] %s",
                        decoded,
                    )

        return_code = (
            await process.wait()
        )

        logger.info(
            "Pipeline завершён "
            "с кодом %s",
            return_code,
        )

        result = read_json(
            PIPELINE_RESULT_FILE
        )

        if result is None:

            result = read_json(
                IMPORT_RESULT_FILE
            )

        if result is None:

            result = {
                "success": (
                    return_code == 0
                ),
                "status": (
                    "success"
                    if return_code == 0
                    else "error"
                ),
                "pipeline_exit_code": (
                    return_code
                ),
            }

        else:

            result = dict(
                result
            )

            result.setdefault(
                "success",
                return_code == 0,
            )

            result.setdefault(
                "pipeline_exit_code",
                return_code,
            )

        if return_code != 0:

            result["success"] = False

            result.setdefault(
                "status",
                "error",
            )

            if not result.get(
                "error"
            ):

                result["error"] = (
                    "Pipeline завершился "
                    f"с кодом {return_code}"
                )

        result[
            "pipeline_output"
        ] = "\n".join(
            output_lines[-50:]
        )

        return result


# ============================================================
# PROCESS VIDEO
# ============================================================

async def process_video(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
) -> None:

    query = update.callback_query

    if not await require_admin(
        update
    ):

        return

    if query:

        try:

            await query.edit_message_text(
                (
                    "⏳ <b>Запускаю обработку...</b>\n\n"
                    "Видео передано в pipeline.\n"
                    "Это может занять некоторое время."
                ),
                parse_mode="HTML",
            )

        except BadRequest:

            pass

    result = await run_pipeline()

    text = get_pipeline_message(
        result
    )

    keyboard = InlineKeyboardMarkup(
        [
            [
                InlineKeyboardButton(
                    "🔄 Повторить",
                    callback_data="menu:video",
                )
            ],
            [
                InlineKeyboardButton(
                    "📥 Импорт",
                    callback_data="menu:import",
                ),
                InlineKeyboardButton(
                    "🏠 Главное",
                    callback_data="menu:home",
                ),
            ],
        ]
    )

    if query:

        try:

            await query.edit_message_text(
                text,
                parse_mode="HTML",
                reply_markup=keyboard,
            )

        except BadRequest as error:

            logger.warning(
                "Не удалось изменить "
                "сообщение pipeline: %s",
                error,
            )

            if update.effective_chat:

                await context.bot.send_message(
                    chat_id=update.effective_chat.id,
                    text=text,
                    parse_mode="HTML",
                    reply_markup=keyboard,
                )

    elif update.message:

        await update.message.reply_text(
            text,
            parse_mode="HTML",
            reply_markup=keyboard,
        )


# ============================================================
# HANDLE VIDEO
# ============================================================

async def handle_video(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
) -> None:

    if not await require_admin(
        update
    ):

        return

    message = update.message

    if not message:

        return

    video = message.video

    if not video:

        await message.reply_text(
            "❌ Видео не найдено."
        )

        return

    PIPELINE_MEDIA_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    temporary_path = (
        PIPELINE_MEDIA_DIR
        / "story_download.tmp"
    )

    final_path = (
        PIPELINE_MEDIA_DIR
        / "story.mp4"
    )

    try:

        await message.reply_text(
            (
                "📥 <b>Получаю видео...</b>\n\n"
                "Сохраняю файл для pipeline."
            ),
            parse_mode="HTML",
        )

        telegram_file = (
            await context.bot.get_file(
                video.file_id
            )
        )

        await telegram_file.download_to_drive(
            custom_path=str(
                temporary_path
            )
        )

        shutil.move(
            str(temporary_path),
            str(final_path),
        )

        logger.info(
            "Видео сохранено: %s",
            final_path,
        )

        await message.reply_text(
            (
                "✅ <b>Видео сохранено.</b>\n\n"
                "Запускаю обработку..."
            ),
            parse_mode="HTML",
        )

        result = await run_pipeline()

        text = get_pipeline_message(
            result
        )

        await message.reply_text(
            text,
            parse_mode="HTML",
            reply_markup=InlineKeyboardMarkup(
                [
                    [
                        InlineKeyboardButton(
                            "🔄 Обработать ещё",
                            callback_data="menu:video",
                        )
                    ],
                    [
                        InlineKeyboardButton(
                            "📥 Импорт",
                            callback_data="menu:import",
                        ),
                        InlineKeyboardButton(
                            "🏠 Главное",
                            callback_data="menu:home",
                        ),
                    ],
                ]
            ),
        )

    except Exception as error:

        logger.exception(
            "Ошибка обработки видео"
        )

        if temporary_path.exists():

            try:

                temporary_path.unlink()

            except Exception:

                pass

        await message.reply_text(
            (
                "❌ <b>Ошибка обработки видео</b>\n\n"
                f"<code>{escape(error)}</code>"
            ),
            parse_mode="HTML",
        )


# ============================================================
# HANDLE DOCUMENT
# ============================================================

async def handle_document(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
) -> None:

    if not await require_admin(
        update
    ):

        return

    message = update.message

    if not message:

        return

    document = message.document

    if not document:

        return

    file_name = (
        document.file_name
        or "uploaded_file"
    )

    suffix = (
        Path(file_name)
        .suffix
        .lower()
    )

    supported_video_extensions = {
        ".mp4",
        ".mov",
        ".mkv",
        ".avi",
        ".webm",
    }

    if suffix not in supported_video_extensions:

        await message.reply_text(
            (
                "📄 Файл получен, "
                "но это не поддерживаемый "
                "видео-формат.\n\n"
                f"Файл: <code>{escape(file_name)}</code>"
            ),
            parse_mode="HTML",
        )

        return

    PIPELINE_MEDIA_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    temporary_path = (
        PIPELINE_MEDIA_DIR
        / "document_download.tmp"
    )

    final_path = (
        PIPELINE_MEDIA_DIR
        / "story.mp4"
    )

    try:

        await message.reply_text(
            (
                "📥 <b>Получаю файл...</b>\n\n"
                f"<code>{escape(file_name)}</code>"
            ),
            parse_mode="HTML",
        )

        telegram_file = (
            await context.bot.get_file(
                document.file_id
            )
        )

        await telegram_file.download_to_drive(
            custom_path=str(
                temporary_path
            )
        )

        shutil.move(
            str(temporary_path),
            str(final_path),
        )

        await message.reply_text(
            (
                "✅ <b>Файл сохранён.</b>\n\n"
                "Запускаю pipeline..."
            ),
            parse_mode="HTML",
        )

        result = await run_pipeline()

        await message.reply_text(
            get_pipeline_message(
                result
            ),
            parse_mode="HTML",
            reply_markup=InlineKeyboardMarkup(
                [
                    [
                        InlineKeyboardButton(
                            "📥 Импорт",
                            callback_data="menu:import",
                        )
                    ],
                    [
                        InlineKeyboardButton(
                            "🏠 Главное",
                            callback_data="menu:home",
                        )
                    ],
                ]
            ),
        )

    except Exception as error:

        logger.exception(
            "Ошибка обработки документа"
        )

        if temporary_path.exists():

            try:

                temporary_path.unlink()

            except Exception:

                pass

        await message.reply_text(
            (
                "❌ <b>Ошибка обработки файла</b>\n\n"
                f"<code>{escape(error)}</code>"
            ),
            parse_mode="HTML",
        )


# ============================================================
# HANDLE TEXT
# ============================================================

async def handle_text(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
) -> None:

    if not await require_admin(
        update
    ):

        return

    message = update.message

    if not message:

        return

    text = (
        message.text or ""
    ).strip()

    if not text:

        return

    lower_text = text.lower()

    if lower_text in {
        "меню",
        "/menu",
        "главное",
    }:

        await show_main_menu(
            update,
            edit=False,
        )

        return

    if lower_text in {
        "заказы",
        "/orders",
    }:

        await orders_command(
            update,
            context,
        )

        return

    if lower_text in {
        "статистика",
        "/stats",
    }:

        await stats_command(
            update,
            context,
        )

        return

    await message.reply_text(
        (
            "👋 <b>TECHSTORE ADMIN</b>\n\n"
            "Я получил сообщение.\n\n"
            "Для управления используй меню "
            "ниже или отправь видео для "
            "автоматического импорта товара."
        ),
        parse_mode="HTML",
        reply_markup=build_main_menu(),
    )


# ============================================================
# ERROR HANDLER
# ============================================================

async def error_handler(
    update: object,
    context: ContextTypes.DEFAULT_TYPE,
) -> None:

    error = context.error

    logger.exception(
        "Ошибка Telegram bot: %s",
        error,
    )

    if isinstance(
        error,
        BadRequest,
    ):

        error_text = str(
            error
        ).lower()

        if (
            "query is too old"
            in error_text
            or "query id is invalid"
            in error_text
            or "message is not modified"
            in error_text
        ):

            return

    if isinstance(
        update,
        Update,
    ):

        try:

            if update.effective_chat:

                await context.bot.send_message(
                    chat_id=(
                        update.effective_chat.id
                    ),
                    text=(
                        "⚠️ Произошла внутренняя "
                        "ошибка бота.\n\n"
                        "Попробуйте ещё раз."
                    ),
                )

        except Exception:

            pass


# ============================================================
# REPAIR POLLING
# ============================================================

async def repair_notifier_job(
    context: ContextTypes.DEFAULT_TYPE,
) -> None:

    try:

        await check_new_repairs(
            context
        )

    except Exception as error:

        logger.exception(
            "Ошибка polling ремонтов: %s",
            error,
        )


# ============================================================
# POST INIT
# ============================================================

async def post_init(
    application: Application,
) -> None:

    logger.info(
        "TECHSTORE ADMIN BOT"
    )

    logger.info(
        "Project: %s",
        PROJECT_DIR,
    )

    logger.info(
        "Importer: %s",
        IMPORTER_DIR,
    )

    logger.info(
        "Pipeline: %s",
        PIPELINE_MAIN,
    )

    logger.info(
        "API: %s",
        TECHSTORE_URL,
    )

    logger.info(
        "Admin ID: %s",
        ADMIN_CHAT_ID,
    )

    logger.info(
        "Telegram statuses: %s",
        ", ".join(
            TELEGRAM_STATUS_BUTTONS
        ),
    )

    init_bot_database()

    initialize_repair_notifier()

    logger.info(
        "Repair notifier initialized."
    )

    if application.job_queue:

        application.job_queue.run_repeating(
            repair_notifier_job,
            interval=10,
            first=5,
            name="repair-notifier",
        )

        logger.info(
            "Repair polling запущен."
        )

    else:

        logger.error(
            "JobQueue недоступен. "
            "Установи python-telegram-bot[job-queue]."
        )


# ============================================================
# MAIN
# ============================================================

def main() -> None:

    if not BOT_TOKEN:

        logger.error(
            "TELEGRAM_BOT_TOKEN "
            "не найден в .env"
        )

        return

    if not ADMIN_CHAT_ID:

        logger.error(
            "TELEGRAM_ADMIN_CHAT_ID "
            "не найден или некорректен."
        )

        return


    application = (
        Application.builder()
        .token(BOT_TOKEN)
        .post_init(post_init)
        .build()
    )

    # ========================================================
    # COMMANDS
    # ========================================================

    application.add_handler(
        CommandHandler(
            "start",
            start_command,
        )
    )

    application.add_handler(
        CommandHandler(
            "menu",
            menu_command,
        )
    )

    application.add_handler(
        CommandHandler(
            "orders",
            orders_command,
        )
    )

    application.add_handler(
        CommandHandler(
            "stats",
            stats_command,
        )
    )

    # ========================================================
    # ORDER STATUS
    #
    # ВАЖНО:
    # Этот handler должен находиться ПЕРЕД
    # общим callback handler.
    # ========================================================

    application.add_handler(
        CallbackQueryHandler(
            handle_order_status,
            pattern=r"^order_status:",
        )
    )

    # ========================================================
    # REPAIR STATUS
    #
    # ВАЖНО:
    # Новый repair_notifier.py использует
    # callback_data вида:
    #
    # repair_status:<id>:<status>
    #
    # ========================================================

    application.add_handler(
        CallbackQueryHandler(
            handle_repair_status,
            pattern=r"^repair_status:",
        )
    )

    # ========================================================
    # GENERAL CALLBACK ROUTER
    # ========================================================

    application.add_handler(
        CallbackQueryHandler(
            handle_menu_callback,
            pattern=(
                r"^(menu:|orders:|order:|"
                r"repairs:|repair:)"
            ),
        )
    )

    # ========================================================
    # VIDEO
    # ========================================================

    application.add_handler(
        MessageHandler(
            filters.VIDEO,
            handle_video,
        )
    )

    # ========================================================
    # DOCUMENT
    # ========================================================

    application.add_handler(
        MessageHandler(
            filters.Document.ALL,
            handle_document,
        )
    )

    # ========================================================
    # TEXT
    # ========================================================

    application.add_handler(
        MessageHandler(
            filters.TEXT
            & ~filters.COMMAND,
            handle_text,
        )
    )

    # ========================================================
    # ERROR HANDLER
    # ========================================================

    application.add_error_handler(
        error_handler
    )

    logger.info(
        "TECHSTORE ADMIN BOT запущен."
    )

    logger.info(
        "Ожидание сообщений..."
    )

    application.run_polling(
        allowed_updates=Update.ALL_TYPES,
        drop_pending_updates=True,
    )


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":

    main()        
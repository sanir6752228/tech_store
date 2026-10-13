import os
import io
import sqlite3
import logging
import asyncio
from pathlib import Path
from typing import Any

from telegram import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    Update,
)
from telegram.ext import ContextTypes


logger = logging.getLogger("TECHSTORE.REPAIR")


# ============================================================
# PATHS / CONFIG
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

DATABASE_PATH = DATA_DIR / "repair_notifier.sqlite3"

API_URL = os.getenv(
    "TECHSTORE_URL",
    "http://localhost:3000",
).rstrip("/")

TELEGRAM_SECRET = os.getenv(
    "TELEGRAM_BOT_SECRET",
    "",
)

ADMIN_CHAT_ID = os.getenv(
    "TELEGRAM_ADMIN_CHAT_ID",
    "",
)


# ============================================================
# REPAIR STATUSES
# ============================================================

REPAIR_STATUSES = {
    "Новая": "🆕",
    "Диагностика": "🔍",
    "Ремонт": "🔧",
    "Готов": "✅",
    "Выдан": "📦",
    "Отменена": "❌",
}

REPAIR_STATUS_ORDER = [
    "Новая",
    "Диагностика",
    "Ремонт",
    "Готов",
    "Выдан",
    "Отменена",
]


# ============================================================
# HTTP
# ============================================================

async def http_request(
    method: str,
    url: str,
    *,
    json_data: dict[str, Any] | None = None,
    timeout: int = 15,
) -> tuple[int, Any]:

    import urllib.request
    import urllib.error
    import json

    def do_request():
        data = None

        if json_data is not None:
            data = json.dumps(
                json_data,
                ensure_ascii=False,
            ).encode("utf-8")

        request = urllib.request.Request(
            url=url,
            data=data,
            method=method.upper(),
        )

        request.add_header(
            "Content-Type",
            "application/json",
        )

        if TELEGRAM_SECRET:
            request.add_header(
                "x-telegram-secret",
                TELEGRAM_SECRET,
            )

        try:
            with urllib.request.urlopen(
                request,
                timeout=timeout,
            ) as response:

                status_code = response.status
                raw = response.read()

                if not raw:
                    return status_code, None

                try:
                    result = json.loads(
                        raw.decode("utf-8")
                    )
                except Exception:
                    result = raw.decode(
                        "utf-8",
                        errors="replace",
                    )

                return status_code, result

        except urllib.error.HTTPError as error:

            raw = error.read()

            try:
                result = json.loads(
                    raw.decode("utf-8")
                )
            except Exception:
                result = raw.decode(
                    "utf-8",
                    errors="replace",
                )

            return error.code, result

        except Exception as error:

            logger.error(
                "HTTP ошибка %s %s: %s",
                method,
                url,
                error,
            )

            raise

    return await asyncio.to_thread(do_request)


# ============================================================
# DATABASE
# ============================================================

def init_database() -> None:

    connection = sqlite3.connect(
        DATABASE_PATH
    )

    try:

        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS notified_repairs (
                repair_id INTEGER PRIMARY KEY,
                notified_at TIMESTAMP
                    DEFAULT CURRENT_TIMESTAMP
            )
            """
        )

        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS repair_view_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                repair_id INTEGER NOT NULL,
                chat_id TEXT NOT NULL,
                message_id INTEGER NOT NULL,
                created_at TIMESTAMP
                    DEFAULT CURRENT_TIMESTAMP
            )
            """
        )

        connection.commit()

    finally:
        connection.close()


def is_repair_notified(
    repair_id: int,
) -> bool:

    connection = sqlite3.connect(
        DATABASE_PATH
    )

    try:

        cursor = connection.execute(
            """
            SELECT repair_id
            FROM notified_repairs
            WHERE repair_id = ?
            """,
            (repair_id,),
        )

        return cursor.fetchone() is not None

    finally:
        connection.close()


def mark_repair_notified(
    repair_id: int,
) -> None:

    connection = sqlite3.connect(
        DATABASE_PATH
    )

    try:

        connection.execute(
            """
            INSERT OR IGNORE INTO notified_repairs
            (repair_id)
            VALUES (?)
            """,
            (repair_id,),
        )

        connection.commit()

    finally:
        connection.close()


# ============================================================
# TEMPORARY TELEGRAM MESSAGE STORAGE
# ============================================================

def remember_view_message(
    repair_id: int,
    chat_id: int | str,
    message_id: int,
) -> None:

    connection = sqlite3.connect(
        DATABASE_PATH
    )

    try:

        connection.execute(
            """
            INSERT INTO repair_view_messages
            (
                repair_id,
                chat_id,
                message_id
            )
            VALUES (?, ?, ?)
            """,
            (
                repair_id,
                str(chat_id),
                message_id,
            ),
        )

        connection.commit()

    finally:
        connection.close()


def get_view_messages(
    repair_id: int,
) -> list[tuple[str, int]]:

    connection = sqlite3.connect(
        DATABASE_PATH
    )

    try:

        cursor = connection.execute(
            """
            SELECT chat_id, message_id
            FROM repair_view_messages
            WHERE repair_id = ?
            ORDER BY id ASC
            """,
            (repair_id,),
        )

        return [
            (
                str(row[0]),
                int(row[1]),
            )
            for row in cursor.fetchall()
        ]

    finally:
        connection.close()


def clear_view_messages(
    repair_id: int,
) -> None:

    connection = sqlite3.connect(
        DATABASE_PATH
    )

    try:

        connection.execute(
            """
            DELETE FROM repair_view_messages
            WHERE repair_id = ?
            """,
            (repair_id,),
        )

        connection.commit()

    finally:
        connection.close()


# ============================================================
# HELPERS
# ============================================================

def safe_text(
    value: Any,
    default: str = "—",
) -> str:

    if value is None:
        return default

    text = str(value).strip()

    if not text:
        return default

    return text


def get_repair_status(
    repair: dict[str, Any],
) -> str:

    status = safe_text(
        repair.get("status"),
        "Новая",
    )

    if status not in REPAIR_STATUSES:
        return "Новая"

    return status


def get_device_name(
    repair: dict[str, Any],
) -> str:

    device_type = safe_text(
        repair.get("deviceType")
    )

    brand = safe_text(
        repair.get("brand")
    )

    model = safe_text(
        repair.get("model")
    )

    if (
        brand != "—"
        and model != "—"
    ):
        return f"{brand} {model}"

    if brand != "—":
        return brand

    if model != "—":
        return model

    return device_type


def get_photos(
    repair: dict[str, Any],
) -> list[Any]:

    photos = repair.get("photos") or []

    if not isinstance(
        photos,
        list,
    ):
        return []

    return photos


# ============================================================
# TEXT
# ============================================================

def format_short_notification(
    repair: dict[str, Any],
) -> str:

    repair_id = repair.get(
        "id",
        "?",
    )

    customer = safe_text(
        repair.get("customerName")
    )

    phone = safe_text(
        repair.get("phone")
    )

    device = get_device_name(
        repair
    )

    photos = get_photos(
        repair
    )

    return (
        "🔔 <b>НОВАЯ ЗАЯВКА НА РЕМОНТ</b>\n\n"
        f"🆔 Заявка: <b>#{repair_id}</b>\n"
        f"👤 {customer}\n"
        f"📞 {phone}\n"
        f"📱 {device}\n"
        f"📷 Фото: {len(photos)}"
    )


def format_repair_card(
    repair: dict[str, Any],
) -> str:

    repair_id = repair.get(
        "id",
        "?",
    )

    customer = safe_text(
        repair.get("customerName")
    )

    phone = safe_text(
        repair.get("phone")
    )

    contact_method = safe_text(
        repair.get("contactMethod")
    )

    city = safe_text(
        repair.get("city")
    )

    address = safe_text(
        repair.get("address")
    )

    device_type = safe_text(
        repair.get("deviceType")
    )

    device = get_device_name(
        repair
    )

    problem = safe_text(
        repair.get("problem")
    )

    description = safe_text(
        repair.get("description")
    )

    status = get_repair_status(
        repair
    )

    status_icon = REPAIR_STATUSES[
        status
    ]

    photos = get_photos(
        repair
    )

    lines = [
        "🔧 <b>ЗАЯВКА НА РЕМОНТ</b>",
        "",
        "━━━━━━━━━━━━━━━━━━",
        "",
        f"🆔 <b>Заявка #{repair_id}</b>",
        "",
        "👤 <b>КЛИЕНТ</b>",
        customer,
        f"📞 {phone}",
        f"💬 Связь: {contact_method}",
        "",
        "📍 <b>АДРЕС</b>",
        f"Город: {city}",
        f"Адрес: {address}",
        "",
        "📱 <b>УСТРОЙСТВО</b>",
        f"Тип: {device_type}",
        f"Модель: {device}",
        "",
        "⚠️ <b>ПРОБЛЕМА</b>",
        problem,
    ]

    if description != "—":

        lines.extend([
            "",
            "📝 <b>ОПИСАНИЕ</b>",
            description,
        ])

    lines.extend([
        "",
        "━━━━━━━━━━━━━━━━━━",
        "",
        f"{status_icon} <b>СТАТУС:</b> {status}",
        "",
        f"📷 Фотографий: <b>{len(photos)}</b>",
    ])

    return "\n".join(lines)


# ============================================================
# KEYBOARDS
# ============================================================

def build_repair_card_keyboard(
    repair_id: int,
    current_status: str,
) -> InlineKeyboardMarkup:

    buttons = []
    row = []

    for status in REPAIR_STATUS_ORDER:

        icon = REPAIR_STATUSES[
            status
        ]

        if status == current_status:
            text = f"☑️ {status}"
        else:
            text = f"{icon} {status}"

        row.append(
            InlineKeyboardButton(
                text=text,
                callback_data=(
                    f"repair_status:"
                    f"{repair_id}:"
                    f"{status}"
                ),
            )
        )

        if len(row) == 2:
            buttons.append(row)
            row = []

    if row:
        buttons.append(row)

    buttons.append([
        InlineKeyboardButton(
            "🧹 Закрыть заявку",
            callback_data=(
                f"repair:close:"
                f"{repair_id}"
            ),
        )
    ])

    buttons.append([
        InlineKeyboardButton(
            "◀️ К ремонтам",
            callback_data=(
                "repairs:dashboard"
            ),
        ),
        InlineKeyboardButton(
            "🏠 Главное",
            callback_data=(
                "menu:home"
            ),
        ),
    ])

    return InlineKeyboardMarkup(
        buttons
    )


def build_repairs_dashboard_keyboard(
    counts: dict[str, int],
) -> InlineKeyboardMarkup:

    buttons = []

    buttons.append([
        InlineKeyboardButton(
            f"🆕 Новые ({counts.get('Новая', 0)})",
            callback_data=(
                "repairs:list:Новая:0"
            ),
        )
    ])

    buttons.append([
        InlineKeyboardButton(
            f"🔍 Диагностика ({counts.get('Диагностика', 0)})",
            callback_data=(
                "repairs:list:Диагностика:0"
            ),
        )
    ])

    buttons.append([
        InlineKeyboardButton(
            f"🔧 В ремонте ({counts.get('Ремонт', 0)})",
            callback_data=(
                "repairs:list:Ремонт:0"
            ),
        )
    ])

    buttons.append([
        InlineKeyboardButton(
            f"✅ Готовы ({counts.get('Готов', 0)})",
            callback_data=(
                "repairs:list:Готов:0"
            ),
        )
    ])

    buttons.append([
        InlineKeyboardButton(
            f"📦 Выданы ({counts.get('Выдан', 0)})",
            callback_data=(
                "repairs:list:Выдан:0"
            ),
        )
    ])

    buttons.append([
        InlineKeyboardButton(
            f"❌ Отменены ({counts.get('Отменена', 0)})",
            callback_data=(
                "repairs:list:Отменена:0"
            ),
        )
    ])

    buttons.append([
        InlineKeyboardButton(
            "📊 Статистика",
            callback_data=(
                "repairs:stats"
            ),
        ),
        InlineKeyboardButton(
            "🔄 Обновить",
            callback_data=(
                "repairs:dashboard"
            ),
        ),
    ])

    buttons.append([
        InlineKeyboardButton(
            "🏠 Главное меню",
            callback_data=(
                "menu:home"
            ),
        )
    ])

    return InlineKeyboardMarkup(
        buttons
    )

# ============================================================
# REPAIR LIST KEYBOARD
# ============================================================

def build_repair_list_keyboard(
    repairs: list[dict[str, Any]],
    status: str,
    page: int = 0,
) -> InlineKeyboardMarkup:

    buttons = []

    for repair in repairs:

        repair_id = repair.get(
            "id"
        )

        if not repair_id:
            continue

        customer = safe_text(
            repair.get("customerName")
        )

        device = get_device_name(
            repair
        )

        label = (
            f"#{repair_id} • "
            f"{customer} • "
            f"{device}"
        )

        if len(label) > 55:
            label = (
                label[:52]
                + "..."
            )

        buttons.append([
            InlineKeyboardButton(
                label,
                callback_data=(
                    f"repair:view:"
                    f"{repair_id}:"
                    f"{status}:"
                    f"{page}"
                ),
            )
        ])

    buttons.append([
        InlineKeyboardButton(
            "◀️ Ремонты",
            callback_data=(
                "repairs:dashboard"
            ),
        )
    ])

    return InlineKeyboardMarkup(
        buttons
    )


# ============================================================
# COUNTS / DASHBOARD
# ============================================================

def calculate_repair_counts(
    repairs: list[dict[str, Any]],
) -> dict[str, int]:

    counts = {
        status: 0
        for status in REPAIR_STATUS_ORDER
    }

    for repair in repairs:

        if not isinstance(
            repair,
            dict,
        ):
            continue

        status = get_repair_status(
            repair
        )

        counts[status] = (
            counts.get(status, 0)
            + 1
        )

    return counts


def format_repairs_dashboard(
    repairs: list[dict[str, Any]],
) -> str:

    counts = calculate_repair_counts(
        repairs
    )

    total = len(repairs)

    active = (
        counts.get("Новая", 0)
        + counts.get("Диагностика", 0)
        + counts.get("Ремонт", 0)
        + counts.get("Готов", 0)
    )

    return (
        "🔧 <b>РЕМОНТЫ TECHSTORE</b>\n\n"
        "━━━━━━━━━━━━━━━━━━\n\n"
        f"📋 Всего заявок: <b>{total}</b>\n"
        f"🔥 Активных: <b>{active}</b>\n\n"
        "━━━━━━━━━━━━━━━━━━\n\n"
        f"🆕 Новые: <b>{counts['Новая']}</b>\n"
        f"🔍 Диагностика: <b>{counts['Диагностика']}</b>\n"
        f"🔧 В ремонте: <b>{counts['Ремонт']}</b>\n"
        f"✅ Готовы: <b>{counts['Готов']}</b>\n"
        f"📦 Выданы: <b>{counts['Выдан']}</b>\n"
        f"❌ Отменены: <b>{counts['Отменена']}</b>\n\n"
        "━━━━━━━━━━━━━━━━━━\n\n"
        "Выберите раздел:"
    )


# ============================================================
# API: GET REPAIRS
# ============================================================

async def get_repairs() -> list[dict[str, Any]]:

    status_code, data = await http_request(
        "GET",
        f"{API_URL}/api/repairs",
    )

    if status_code != 200:

        logger.error(
            "GET /api/repairs -> HTTP %s: %s",
            status_code,
            data,
        )

        return []

    if not isinstance(
        data,
        list,
    ):

        logger.error(
            "API /api/repairs вернул не список: %r",
            data,
        )

        return []

    repairs = [
        repair
        for repair in data
        if isinstance(
            repair,
            dict,
        )
    ]

    repairs.sort(
        key=lambda item: int(
            item.get(
                "id",
                0,
            )
            or 0
        ),
        reverse=True,
    )

    return repairs


# ============================================================
# DASHBOARD
# ============================================================

async def show_repairs_dashboard(
    update: Update,
    *,
    edit: bool = True,
) -> None:

    query = update.callback_query

    try:

        repairs = await get_repairs()

        text = format_repairs_dashboard(
            repairs
        )

        keyboard = (
            build_repairs_dashboard_keyboard(
                calculate_repair_counts(
                    repairs
                )
            )
        )

        if query and edit:

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

    except Exception:

        logger.exception(
            "Ошибка открытия панели ремонтов"
        )

        if query:

            try:

                await query.edit_message_text(
                    "❌ Не удалось загрузить ремонты.",
                    reply_markup=InlineKeyboardMarkup([
                        [
                            InlineKeyboardButton(
                                "🔄 Повторить",
                                callback_data=(
                                    "repairs:dashboard"
                                ),
                            )
                        ],
                        [
                            InlineKeyboardButton(
                                "🏠 Главное",
                                callback_data=(
                                    "menu:home"
                                ),
                            )
                        ],
                    ]),
                )

            except Exception:
                logger.exception(
                    "Не удалось показать ошибку панели ремонтов"
                )


# ============================================================
# REPAIR LIST
# ============================================================

async def show_repairs_list(
    update: Update,
    status: str,
    page: int = 0,
) -> None:

    query = update.callback_query

    if status not in REPAIR_STATUSES:

        if query:

            await query.answer(
                "Неизвестный статус",
                show_alert=True,
            )

        return

    repairs = await get_repairs()

    filtered = [
        repair
        for repair in repairs
        if get_repair_status(
            repair
        ) == status
    ]

    page_size = 8

    start = (
        page
        * page_size
    )

    end = (
        start
        + page_size
    )

    page_items = filtered[
        start:end
    ]

    icon = REPAIR_STATUSES[
        status
    ]

    text_lines = [
        f"{icon} <b>{status.upper()}</b>",
        "",
        f"Заявок: <b>{len(filtered)}</b>",
        "",
    ]

    if not page_items:

        text_lines.append(
            "Здесь пока нет заявок."
        )

    else:

        text_lines.append(
            "Выберите заявку:"
        )

        text_lines.append("")

        for repair in page_items:

            repair_id = repair.get(
                "id",
                "?",
            )

            customer = safe_text(
                repair.get(
                    "customerName"
                )
            )

            device = get_device_name(
                repair
            )

            text_lines.append(
                f"• <b>#{repair_id}</b> "
                f"{customer} — {device}"
            )

    buttons = (
        build_repair_list_keyboard(
            page_items,
            status,
            page,
        ).inline_keyboard
    )

    pagination = []

    if page > 0:

        pagination.append(
            InlineKeyboardButton(
                "⬅️",
                callback_data=(
                    f"repairs:list:"
                    f"{status}:"
                    f"{page - 1}"
                ),
            )
        )

    if end < len(filtered):

        pagination.append(
            InlineKeyboardButton(
                "➡️",
                callback_data=(
                    f"repairs:list:"
                    f"{status}:"
                    f"{page + 1}"
                ),
            )
        )

    if pagination:

        buttons.insert(
            -1,
            pagination,
        )

    keyboard = InlineKeyboardMarkup(
        buttons
    )

    if query:

        await query.edit_message_text(
            "\n".join(
                text_lines
            ),
            parse_mode="HTML",
            reply_markup=keyboard,
        )


# ============================================================
# DOWNLOAD PHOTO
# ============================================================

async def download_photo(
    photo_url: str,
) -> bytes | None:

    import urllib.request

    if not photo_url:
        return None

    if photo_url.startswith("/"):

        url = (
            API_URL
            + photo_url
        )

    else:

        url = photo_url

    def download():

        try:

            request = urllib.request.Request(
                url,
                method="GET",
            )

            with urllib.request.urlopen(
                request,
                timeout=20,
            ) as response:

                return response.read()

        except Exception as error:

            logger.error(
                "Ошибка загрузки фото %s: %s",
                url,
                error,
            )

            return None

    return await asyncio.to_thread(
        download
    )


# ============================================================
# CLEAN OLD VIEW
# ============================================================

async def cleanup_repair_messages(
    context: ContextTypes.DEFAULT_TYPE,
    repair_id: int,
) -> int:

    messages = get_view_messages(
        repair_id
    )

    deleted = 0

    for chat_id, message_id in messages:

        try:

            await context.bot.delete_message(
                chat_id=chat_id,
                message_id=message_id,
            )

            deleted += 1

        except Exception as error:

            logger.debug(
                "Не удалось удалить сообщение "
                "%s в чате %s: %s",
                message_id,
                chat_id,
                error,
            )

    clear_view_messages(
        repair_id
    )

    return deleted


# ============================================================
# SHOW REPAIR
# ============================================================

async def show_repair(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
    repair_id: int,
    previous_status: str = "Новая",
    page: int = 0,
) -> None:

    query = update.callback_query

    repairs = await get_repairs()

    repair = None

    for item in repairs:

        try:

            if int(
                item.get(
                    "id",
                    0,
                )
            ) == repair_id:

                repair = item
                break

        except Exception:
            continue

    if not repair:

        if query:

            await query.edit_message_text(
                "❌ <b>Заявка не найдена</b>",
                parse_mode="HTML",
                reply_markup=InlineKeyboardMarkup([
                    [
                        InlineKeyboardButton(
                            "◀️ Ремонты",
                            callback_data=(
                                "repairs:dashboard"
                            ),
                        )
                    ]
                ]),
            )

        return

    # Удаляем старые временные сообщения,
    # если заявка уже открывалась ранее.
    await cleanup_repair_messages(
        context,
        repair_id,
    )

    status = get_repair_status(
        repair
    )

    photos = get_photos(
        repair
    )

    chat_id = None

    if query and query.message:

        chat_id = query.message.chat_id

    elif update.effective_chat:

        chat_id = update.effective_chat.id

    # --------------------------------------------------------
    # 1. СНАЧАЛА ОТПРАВЛЯЕМ ФОТО
    # --------------------------------------------------------

    sent_photos = 0

    if chat_id is not None and photos:

        for index, photo_url in enumerate(
            photos,
            start=1,
        ):

            photo_bytes = await download_photo(
                str(photo_url)
            )

            if not photo_bytes:
                continue

            photo_file = io.BytesIO(
                photo_bytes
            )

            photo_file.name = (
                f"repair-{repair_id}-"
                f"{index}.jpg"
            )

            try:

                message = (
                    await context.bot.send_photo(
                        chat_id=chat_id,
                        photo=photo_file,
                        caption=(
                            f"🔧 <b>Заявка #{repair_id}</b>\n"
                            f"📷 Фото {index} "
                            f"из {len(photos)}"
                        ),
                        parse_mode="HTML",
                    )
                )

                remember_view_message(
                    repair_id,
                    chat_id,
                    message.message_id,
                )

                sent_photos += 1

            except Exception:

                logger.exception(
                    "Ошибка отправки "
                    "фото заявки #%s",
                    repair_id,
                )

    # --------------------------------------------------------
    # 2. КАРТОЧКА ЗАЯВКИ
    # --------------------------------------------------------

    keyboard = (
        build_repair_card_keyboard(
            repair_id,
            status,
        )
    )

    text = format_repair_card(
        repair
    )

    if query and query.message:

        try:

            await query.edit_message_text(
                text,
                parse_mode="HTML",
                reply_markup=keyboard,
            )

            remember_view_message(
                repair_id,
                query.message.chat_id,
                query.message.message_id,
            )

        except Exception:

            logger.exception(
                "Ошибка отображения "
                "карточки ремонта #%s",
                repair_id,
            )

    elif chat_id is not None:

        try:

            message = (
                await context.bot.send_message(
                    chat_id=chat_id,
                    text=text,
                    parse_mode="HTML",
                    reply_markup=keyboard,
                )
            )

            remember_view_message(
                repair_id,
                chat_id,
                message.message_id,
            )

        except Exception:

            logger.exception(
                "Ошибка отправки "
                "карточки ремонта #%s",
                repair_id,
            )

    logger.info(
        "Открыта заявка #%s: "
        "отправлено фото %s/%s",
        repair_id,
        sent_photos,
        len(photos),
    )


# ============================================================
# CLOSE REPAIR VIEW
# ============================================================

async def close_repair_view(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
    repair_id: int,
) -> None:

    query = update.callback_query

    if not query:
        return

    await query.answer(
        "🧹 Очищаем заявку..."
    )

    current_message_id = None
    current_chat_id = None

    if query.message:

        current_message_id = (
            query.message.message_id
        )

        current_chat_id = (
            query.message.chat_id
        )

    messages = get_view_messages(
        repair_id
    )

    deleted = 0

    for chat_id, message_id in messages:

        # Текущее сообщение не удаляем.
        # Оно будет превращено в главное меню
        # через bot.py.
        if (
            current_message_id is not None
            and str(chat_id)
            == str(current_chat_id)
            and int(message_id)
            == int(current_message_id)
        ):
            continue

        try:

            await context.bot.delete_message(
                chat_id=chat_id,
                message_id=message_id,
            )

            deleted += 1

        except Exception as error:

            logger.debug(
                "Не удалось удалить "
                "временное сообщение #%s: %s",
                message_id,
                error,
            )

    clear_view_messages(
        repair_id
    )

    logger.info(
        "Заявка #%s закрыта. "
        "Удалено сообщений: %s",
        repair_id,
        deleted,
    )


# ============================================================
# REPAIR STATISTICS
# ============================================================

async def show_repair_statistics(
    update: Update,
) -> None:

    query = update.callback_query

    repairs = await get_repairs()

    counts = calculate_repair_counts(
        repairs
    )

    total = len(repairs)

    active = (
        counts["Новая"]
        + counts["Диагностика"]
        + counts["Ремонт"]
        + counts["Готов"]
    )

    text = (
        "📊 <b>СТАТИСТИКА РЕМОНТОВ</b>\n\n"
        "━━━━━━━━━━━━━━━━━━\n\n"
        f"📋 Всего: <b>{total}</b>\n"
        f"🔥 Активных: <b>{active}</b>\n\n"
        f"🆕 Новых: <b>{counts['Новая']}</b>\n"
        f"🔍 Диагностика: <b>{counts['Диагностика']}</b>\n"
        f"🔧 В ремонте: <b>{counts['Ремонт']}</b>\n"
        f"✅ Готовы: <b>{counts['Готов']}</b>\n"
        f"📦 Выданы: <b>{counts['Выдан']}</b>\n"
        f"❌ Отменены: <b>{counts['Отменена']}</b>\n\n"
        "━━━━━━━━━━━━━━━━━━"
    )

    if query:

        await query.edit_message_text(
            text,
            parse_mode="HTML",
            reply_markup=InlineKeyboardMarkup([
                [
                    InlineKeyboardButton(
                        "🔄 Обновить",
                        callback_data=(
                            "repairs:stats"
                        ),
                    )
                ],
                [
                    InlineKeyboardButton(
                        "◀️ Ремонты",
                        callback_data=(
                            "repairs:dashboard"
                        ),
                    )
                ],
                [
                    InlineKeyboardButton(
                        "🏠 Главное",
                        callback_data=(
                            "menu:home"
                        ),
                    )
                ],
            ]),
        )


# ============================================================
# STATUS CHANGE
# ============================================================

async def handle_repair_status(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
) -> None:

    query = update.callback_query

    if not query:
        return

    data = query.data or ""

    if not data.startswith(
        "repair_status:"
    ):
        return

    parts = data.split(
        ":",
        2,
    )

    if len(parts) != 3:
        return

    try:

        repair_id = int(
            parts[1]
        )

    except ValueError:

        await query.answer(
            "Некорректный ID заявки",
            show_alert=True,
        )

        return

    status = parts[2].strip()

    if status not in REPAIR_STATUSES:

        await query.answer(
            "Недопустимый статус",
            show_alert=True,
        )

        return

    try:

        status_code, result = (
            await http_request(
                "PATCH",
                f"{API_URL}/api/repairs",
                json_data={
                    "id": repair_id,
                    "status": status,
                },
            )
        )

        if status_code != 200:

            logger.error(
                "PATCH /api/repairs -> "
                "HTTP %s: %s",
                status_code,
                result,
            )

            await query.answer(
                "Не удалось изменить статус",
                show_alert=True,
            )

            return

        logger.info(
            "Статус заявки #%s изменён: %s",
            repair_id,
            status,
        )

        await query.answer(
            f"{REPAIR_STATUSES[status]} {status}"
        )

        # После изменения статуса снова
        # показываем карточку.
        await show_repair(
            update,
            context,
            repair_id,
        )

    except Exception:

        logger.exception(
            "Ошибка изменения "
            "статуса заявки #%s",
            repair_id,
        )

        try:

            await query.answer(
                "Ошибка сервера",
                show_alert=True,
            )

        except Exception:
            pass


# ============================================================
# NEW REPAIR NOTIFICATION
# ============================================================

async def send_repair_notification(
    context: ContextTypes.DEFAULT_TYPE,
    repair: dict[str, Any],
) -> bool:

    if not ADMIN_CHAT_ID:

        logger.error(
            "TELEGRAM_ADMIN_CHAT_ID не задан"
        )

        return False

    try:

        repair_id = int(
            repair["id"]
        )

    except Exception:

        logger.error(
            "У заявки отсутствует "
            "корректный ID"
        )

        return False

    text = format_short_notification(
        repair
    )

    keyboard = InlineKeyboardMarkup([
        [
            InlineKeyboardButton(
                "🔧 Открыть заявку",
                callback_data=(
                    f"repair:view:"
                    f"{repair_id}:"
                    f"Новая:0"
                ),
            )
        ],
        [
            InlineKeyboardButton(
                "📋 Все ремонты",
                callback_data=(
                    "repairs:dashboard"
                ),
            )
        ],
    ])

    try:

        await context.bot.send_message(
            chat_id=ADMIN_CHAT_ID,
            text=text,
            parse_mode="HTML",
            reply_markup=keyboard,
        )

        logger.info(
            "Короткое уведомление "
            "по заявке #%s отправлено",
            repair_id,
        )

        return True

    except Exception:

        logger.exception(
            "Ошибка отправки уведомления "
            "по заявке #%s",
            repair_id,
        )

        return False


# ============================================================
# POLLING NEW REPAIRS
# ============================================================

async def check_new_repairs(
    context: ContextTypes.DEFAULT_TYPE,
) -> None:

    try:

        status_code, data = (
            await http_request(
                "GET",
                f"{API_URL}/api/repairs",
            )
        )

        if status_code != 200:

            logger.error(
                "GET /api/repairs -> "
                "HTTP %s: %s",
                status_code,
                data,
            )

            return

        if not isinstance(
            data,
            list,
        ):

            logger.error(
                "GET /api/repairs "
                "вернул не список: %r",
                data,
            )

            return

        for repair in data:

            if not isinstance(
                repair,
                dict,
            ):
                continue

            repair_id = repair.get(
                "id"
            )

            if not repair_id:
                continue

            repair_id = int(
                repair_id
            )

            if is_repair_notified(
                repair_id
            ):
                continue

            success = (
                await send_repair_notification(
                    context,
                    repair,
                )
            )

            if success:

                mark_repair_notified(
                    repair_id
                )

                logger.info(
                    "Заявка #%s отправлена "
                    "в Telegram",
                    repair_id,
                )

    except Exception:

        logger.exception(
            "Ошибка проверки "
            "новых заявок на ремонт"
        )


# ============================================================
# INITIALIZATION
# ============================================================

def initialize_repair_notifier() -> None:

    init_database()

    logger.info(
        "Repair notifier initialized"
    )

    logger.info(
        "API: %s",
        API_URL,
    )

    logger.info(
        "Admin chat ID: %s",
        ADMIN_CHAT_ID,
    )
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import psycopg2 # type: ignore
from psycopg2.extras import Json # type: ignore

from config import (
    DATABASE_URL,
    ENRICHED_PRODUCT_FILE,
    VALIDATION_FILE,
    IMPORT_RESULT_FILE,
)

from deduplicator import (
    calculate_fingerprint,
    find_duplicate,
)


# =========================================================
# HELPERS
# =========================================================

def load_json(path: Path) -> dict[str, Any]:
    """
    Загружает JSON-объект.
    """

    if not path.exists():
        raise FileNotFoundError(
            f"Файл не найден:\n{path}"
        )

    with open(
        path,
        "r",
        encoding="utf-8",
    ) as file:

        data = json.load(file)

    if not isinstance(data, dict):
        raise ValueError(
            f"JSON должен содержать объект:\n{path}"
        )

    return data


def clean_string(value: Any) -> str | None:
    """
    Безопасная строка.
    """

    if value is None:
        return None

    value = str(value).strip()

    return value if value else None


def safe_int(value: Any) -> int | None:
    """
    Безопасное целое число.
    """

    if value is None:
        return None

    try:
        return int(float(value))
    except (TypeError, ValueError):
        return None


def safe_float(value: Any) -> float | None:
    """
    Безопасное число с плавающей точкой.
    """

    if value is None:
        return None

    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def get_images(product: dict[str, Any]) -> list[str]:
    """
    Получает изображения товара.
    """

    images = product.get("images")

    if not isinstance(images, list):
        return []

    result: list[str] = []

    for image in images:

        value = clean_string(image)

        if value:
            result.append(value)

    return result


# =========================================================
# CATEGORY
# =========================================================

def normalize_category(
    category: str | None,
) -> dict[str, str]:
    """
    Приводит категорию импортёра
    к категории магазина.
    """

    value = (
        category or "other"
    ).strip().lower()

    aliases = {

        # Phones
        "phone": {
            "slug": "phones",
            "name": "Телефоны",
        },

        "phones": {
            "slug": "phones",
            "name": "Телефоны",
        },

        "смартфоны": {
            "slug": "phones",
            "name": "Телефоны",
        },

        "телефоны": {
            "slug": "phones",
            "name": "Телефоны",
        },

        # Tablets
        "tablet": {
            "slug": "tablets",
            "name": "Планшеты",
        },

        "tablets": {
            "slug": "tablets",
            "name": "Планшеты",
        },

        "планшеты": {
            "slug": "tablets",
            "name": "Планшеты",
        },

        # Accessories
        "accessory": {
            "slug": "accessories",
            "name": "Аксессуары",
        },

        "accessories": {
            "slug": "accessories",
            "name": "Аксессуары",
        },

        "аксессуары": {
            "slug": "accessories",
            "name": "Аксессуары",
        },

        # Chargers
        "charger": {
            "slug": "chargers",
            "name": "Зарядки",
        },

        "chargers": {
            "slug": "chargers",
            "name": "Зарядки",
        },

        "charging": {
            "slug": "chargers",
            "name": "Зарядки",
        },

        "зарядки": {
            "slug": "chargers",
            "name": "Зарядки",
        },

        # Cables
        "cable": {
            "slug": "cables",
            "name": "Кабели",
        },

        "cables": {
            "slug": "cables",
            "name": "Кабели",
        },

        "кабели": {
            "slug": "cables",
            "name": "Кабели",
        },

        # Laptops
        "laptop": {
            "slug": "laptops",
            "name": "Ноутбуки",
        },

        "laptops": {
            "slug": "laptops",
            "name": "Ноутбуки",
        },

        "ноутбуки": {
            "slug": "laptops",
            "name": "Ноутбуки",
        },

        # Headphones
        "headphone": {
            "slug": "headphones",
            "name": "Наушники",
        },

        "headphones": {
            "slug": "headphones",
            "name": "Наушники",
        },

        "наушники": {
            "slug": "headphones",
            "name": "Наушники",
        },

        # Watches
        "watch": {
            "slug": "watches",
            "name": "Смарт-часы",
        },

        "watches": {
            "slug": "watches",
            "name": "Смарт-часы",
        },

        "smartwatch": {
            "slug": "watches",
            "name": "Смарт-часы",
        },

        "смарт-часы": {
            "slug": "watches",
            "name": "Смарт-часы",
        },

        # Cases
        "case": {
            "slug": "cases",
            "name": "Чехлы",
        },

        "cases": {
            "slug": "cases",
            "name": "Чехлы",
        },

        "чехлы": {
            "slug": "cases",
            "name": "Чехлы",
        },

        # Other
        "other": {
            "slug": "other",
            "name": "Другое",
        },

        "другое": {
            "slug": "other",
            "name": "Другое",
        },
    }

    if value in aliases:
        return aliases[value]

    # Безопасный fallback
    slug = value

    if not slug:
        slug = "other"

    slug = slug.replace(
        " ",
        "-",
    )

    return {
        "slug": slug,
        "name": category or "Другое",
    }


# =========================================================
# DATABASE
# =========================================================

def get_connection():
    """
    Подключение к PostgreSQL.
    """

    if not DATABASE_URL:
        raise RuntimeError(
            "DATABASE_URL не найден."
        )

    return psycopg2.connect(
        DATABASE_URL
    )


# =========================================================
# SAVE IMPORT RESULT
# =========================================================

def save_import_result(
    result: dict[str, Any],
) -> None:

    IMPORT_RESULT_FILE.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    with open(
        IMPORT_RESULT_FILE,
        "w",
        encoding="utf-8",
    ) as file:

        json.dump(
            result,
            file,
            ensure_ascii=False,
            indent=2,
        )


# =========================================================
# MAIN SAVE
# =========================================================

def save_draft(
    product: dict[str, Any],
) -> dict[str, Any]:

    # -----------------------------------------------------
    # VALIDATION FILE
    # -----------------------------------------------------

    validation = load_json(
        VALIDATION_FILE
    )

    if not validation.get("valid", False):

        raise RuntimeError(
            "Товар не прошёл validation. "
            "Сохранение отменено."
        )

    # -----------------------------------------------------
    # PRODUCT DATA
    # -----------------------------------------------------

    name = clean_string(
        product.get("name")
    )

    if not name:
        raise ValueError(
            "У товара отсутствует name."
        )

    brand = clean_string(
        product.get("brand")
    )

    model = clean_string(
        product.get("model")
    )

    category = normalize_category(
        clean_string(
            product.get("category")
        )
    )

    condition = clean_string(
        product.get("condition")
    ) or "Не указано"

    memory = clean_string(
        product.get("memory")
    )

    color = clean_string(
        product.get("color")
    )

    battery = clean_string(
        product.get("battery")
    )

    price = safe_int(
        product.get("price")
    )

    if price is None or price <= 0:

        raise ValueError(
            "Цена должна быть больше 0."
        )

    old_price = safe_int(
        product.get("oldPrice")
    )

    description = clean_string(
        product.get("description")
    )

    display = clean_string(
        product.get("display")
    )

    processor = clean_string(
        product.get("processor")
    )

    camera = clean_string(
        product.get("camera")
    )

    sim = clean_string(
        product.get("sim")
    )

    year = safe_int(
        product.get("year")
    )

    images = get_images(
        product
    )

    telegram_video = clean_string(
        product.get("telegramVideo")
    )

    source_type = clean_string(
        product.get("sourceType")
    )

    source_url = clean_string(
        product.get("sourceUrl")
    )

    ocr_confidence = safe_float(
        product.get("ocrConfidence")
    )

    research_verified = bool(
        product.get(
            "researchVerified",
            False,
        )
    )

    research_source = clean_string(
        product.get("researchSource")
    )

    research_url = clean_string(
        product.get("researchUrl")
    )

    # -----------------------------------------------------
    # FINGERPRINT
    # -----------------------------------------------------

    fingerprint = calculate_fingerprint(
        product
    )

    # -----------------------------------------------------
    # RAW DATA
    # -----------------------------------------------------

    raw_data = dict(
        product
    )

    raw_data["fingerprint"] = (
        fingerprint
    )

    raw_data["validation"] = (
        validation
    )

    # -----------------------------------------------------
    # DATABASE
    # -----------------------------------------------------

    connection = get_connection()

    try:

        # -------------------------------------------------
        # DUPLICATE CHECK
        # -------------------------------------------------

        duplicate = find_duplicate(
            product,
            connection=connection,
        )

        if duplicate["is_duplicate"]:

            draft = duplicate["draft"]

            result = {

                "status": "DUPLICATE",

                "draftId": draft[0],

                "method": duplicate["method"],

                "fingerprint": fingerprint,

                "message": (
                    "Товар уже существует "
                    "в ProductDraft."
                ),
            }

            save_import_result(
                result
            )

            print()

            print("=" * 70)
            print("TECHSTORE SAVE DRAFT")
            print("=" * 70)

            print()

            print(
                f"Товар:          {name}"
            )

            print(
                f"Draft ID:       {draft[0]}"
            )

            print(
                f"Status:         {draft[1]}"
            )

            print(
                f"Метод:          {duplicate['method']}"
            )

            print()

            print(
                "⚠ ДУБЛИКАТ"
            )

            print(
                "Новый ProductDraft НЕ создан."
            )

            print()

            print(
                f"Результат: {IMPORT_RESULT_FILE}"
            )

            print()

            print("=" * 70)

            return result

        # -------------------------------------------------
        # TRANSACTION
        # -------------------------------------------------

        cursor = connection.cursor()

        try:

            # ---------------------------------------------
            # CATEGORY UPSERT
            # ---------------------------------------------

            cursor.execute(
                '''
                INSERT INTO "Category"
                    ("name", "slug")
                VALUES
                    (%s, %s)
                ON CONFLICT ("slug")
                DO UPDATE SET
                    "name" = EXCLUDED."name"
                RETURNING "id"
                ''',
                (
                    category["name"],
                    category["slug"],
                ),
            )

            category_id = cursor.fetchone()[0]

            # ---------------------------------------------
            # PRODUCT DRAFT
            # ---------------------------------------------

            cursor.execute(
                '''
                INSERT INTO "ProductDraft" (
                    "name",
                    "brand",
                    "model",
                    "category",
                    "condition",
                    "memory",
                    "color",
                    "battery",
                    "price",
                    "oldPrice",
                    "description",
                    "display",
                    "processor",
                    "camera",
                    "sim",
                    "year",
                    "images",
                    "telegramVideo",
                    "sourceType",
                    "sourceUrl",
                    "ocrConfidence",
                    "researchVerified",
                    "researchSource",
                    "researchUrl",
                    "rawData",
                    "status",
                    "adminComment",
                    "createdAt",
                    "updatedAt"
                )
                VALUES (
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    'PENDING',
                    NULL,
                    NOW(),
                    NOW()
                )
                RETURNING "id"
                ''',
                (
                    name,
                    brand,
                    model,
                    category["slug"],
                    condition,
                    memory,
                    color,
                    battery,
                    price,
                    old_price,
                    description,
                    display,
                    processor,
                    camera,
                    sim,
                    year,
                    images,
                    telegram_video,
                    source_type,
                    source_url,
                    ocr_confidence,
                    research_verified,
                    research_source,
                    research_url,
                    Json(raw_data),
                ),
            )

            draft_id = cursor.fetchone()[0]

            connection.commit()

        except Exception:

            connection.rollback()

            raise

        finally:

            cursor.close()

        # -------------------------------------------------
        # RESULT
        # -------------------------------------------------

        result = {

            "status": "CREATED",

            "draftId": draft_id,

            "categoryId": category_id,

            "category": category["slug"],

            "fingerprint": fingerprint,

            "images": len(images),

            "ocrConfidence": ocr_confidence,

            "researchVerified": (
                research_verified
            ),

            "message": (
                "ProductDraft успешно создан."
            ),
        }

        save_import_result(
            result
        )

        # -------------------------------------------------
        # CONSOLE
        # -------------------------------------------------

        print()

        print("=" * 70)
        print("TECHSTORE SAVE DRAFT")
        print("=" * 70)

        print()

        print(
            f"Название:       {name}"
        )

        print(
            f"Бренд:          {brand or '—'}"
        )

        print(
            f"Модель:         {model or '—'}"
        )

        print(
            f"Категория:      {category['slug']}"
        )

        print(
            f"Состояние:      {condition}"
        )

        print(
            f"Память:         {memory or '—'}"
        )

        print(
            f"Цена:           {price:,} ₽".replace(
                ",",
                " ",
            )
        )

        print(
            f"Фотографий:     {len(images)}"
        )

        if ocr_confidence is not None:

            print(
                f"OCR:            "
                f"{ocr_confidence:.1%}"
            )

        print()

        print(
            "ПОДКЛЮЧЕНИЕ К POSTGRESQL..."
        )

        print(
            "Подключение успешно."
        )

        print()

        print(
            "PRODUCT DRAFT СОЗДАН"
        )

        print()

        print(
            f"ID:              {draft_id}"
        )

        print(
            "Status:          PENDING"
        )

        print(
            f"Category ID:     {category_id}"
        )

        print()

        print(
            "Изображения:"
        )

        for index, image in enumerate(
            images,
            start=1,
        ):

            print(
                f"  {index}. {image}"
            )

        print()

        print(
            "✓ Новый товар добавлен "
            "в очередь модерации."
        )

        print(
            "✓ В каталоге пока НЕ опубликован."
        )

        print()

        print(
            f"Результат: {IMPORT_RESULT_FILE}"
        )

        print()

        print("=" * 70)

        return result

    finally:

        connection.close()


# =========================================================
# ENTRY POINT
# =========================================================

def main() -> None:

    product = load_json(
        ENRICHED_PRODUCT_FILE
    )

    save_draft(
        product
    )


if __name__ == "__main__":
    main()
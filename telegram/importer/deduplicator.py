from __future__ import annotations

import hashlib
import json
import re
from typing import Any

import psycopg2  # type: ignore

from config import DATABASE_URL


# =========================================================
# NORMALIZATION
# =========================================================

def normalize(value: Any) -> str:
    """
    Приводит значение к единому виду для сравнения.
    """

    if value is None:
        return ""

    text = str(value).lower().strip()

    # Убираем лишние пробелы
    text = re.sub(
        r"\s+",
        " ",
        text,
    )

    return text


def normalize_model(value: Any) -> str:
    """
    Нормализация модели.

    Например:

    iPhone 14
    iphone 14
    IPHONE 14

    будут считаться одной моделью.
    """

    text = normalize(value)

    text = text.replace(
        "apple ",
        "",
    )

    text = re.sub(
        r"\s+",
        " ",
        text,
    )

    return text.strip()


def normalize_memory(value: Any) -> str:
    """
    Нормализация памяти.

    256 GB
    256GB
    256 гб

    → 256gb
    """

    text = normalize(value)

    text = text.replace(
        " ",
        "",
    )

    text = text.replace(
        "гб",
        "gb",
    )

    return text


def normalize_condition(value: Any) -> str:
    """
    Нормализация состояния товара.
    """

    text = normalize(value)

    replacements = {
        "б/у": "used",
        "бу": "used",
        "б у": "used",
        "used": "used",

        "новый": "new",
        "новое": "new",
        "новая": "new",
        "new": "new",
    }

    return replacements.get(
        text,
        text,
    )


# =========================================================
# FINGERPRINT
# =========================================================

def calculate_fingerprint(
    product: dict[str, Any],
) -> str:
    """
    Создаёт fingerprint товара.

    Fingerprint используется для определения,
    импортировался ли этот товар раньше.

    В fingerprint участвуют:

    - название
    - бренд
    - модель
    - память
    - состояние
    - цена
    - категория
    """

    normalized = {
        "name": normalize(
            product.get("name")
        ),

        "brand": normalize(
            product.get("brand")
        ),

        "model": normalize_model(
            product.get("model")
        ),

        "memory": normalize_memory(
            product.get("memory")
        ),

        "condition": normalize_condition(
            product.get("condition")
        ),

        "price": int(
            product.get("price") or 0
        ),

        "category": normalize(
            product.get("category")
        ),
    }

    raw = json.dumps(
        normalized,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    )

    return hashlib.sha256(
        raw.encode("utf-8")
    ).hexdigest()


# =========================================================
# DATABASE CONNECTION
# =========================================================

def get_connection():
    """
    Создаёт соединение с PostgreSQL.
    """

    if not DATABASE_URL:
        raise RuntimeError(
            "DATABASE_URL не найден."
        )

    return psycopg2.connect(
        DATABASE_URL
    )


# =========================================================
# ACTIVE STATUSES
# =========================================================

ACTIVE_STATUSES = (
    "PENDING",
    "APPROVED",
)


def is_active_status(status: Any) -> bool:
    """
    Проверяет, является ли статус активным.

    Только PENDING и APPROVED блокируют повторный импорт.

    REJECTED
    ERROR
    DUPLICATE

    не блокируют импорт.
    """

    return normalize(status).upper() in ACTIVE_STATUSES


# =========================================================
# SEARCH BY FINGERPRINT
# =========================================================

def find_by_fingerprint(
    fingerprint: str,
    connection=None,
):
    """
    Ищет активный ProductDraft по fingerprint.

    ВАЖНО:

    Мы НЕ считаем дубликатами записи со статусами:

    REJECTED
    ERROR
    DUPLICATE

    Они могут остаться в базе как история,
    но не должны блокировать новый импорт.
    """

    own_connection = False

    if connection is None:
        connection = get_connection()
        own_connection = True

    cursor = connection.cursor()

    try:
        cursor.execute(
            '''
            SELECT
                "id",
                "status",
                "name",
                "brand",
                "model",
                "memory",
                "price",
                "createdAt"
            FROM "ProductDraft"
            WHERE
                "rawData"->>'fingerprint' = %s
                AND "status" IN ('PENDING', 'APPROVED')
            ORDER BY "createdAt" DESC
            LIMIT 1
            ''',
            (
                fingerprint,
            ),
        )

        return cursor.fetchone()

    finally:
        cursor.close()

        if own_connection:
            connection.close()


# =========================================================
# SEARCH OLD DRAFTS
# =========================================================

def find_similar_draft(
    product: dict[str, Any],
    connection=None,
):
    """
    Ищет активные старые ProductDraft,
    которые были созданы до появления fingerprint.

    Проверяются:

    - name
    - brand
    - model
    - memory
    - condition
    - price

    ВАЖНО:

    Проверяются только PENDING и APPROVED.

    Старые REJECTED / ERROR / DUPLICATE
    не блокируют повторный импорт.
    """

    own_connection = False

    if connection is None:
        connection = get_connection()
        own_connection = True

    cursor = connection.cursor()

    try:
        name = normalize(
            product.get("name")
        )

        brand = normalize(
            product.get("brand")
        )

        model = normalize_model(
            product.get("model")
        )

        memory = normalize_memory(
            product.get("memory")
        )

        condition = normalize_condition(
            product.get("condition")
        )

        price = int(
            product.get("price") or 0
        )

        # -------------------------------------------------
        # 1. ТОЧНЫЙ ПОИСК
        # -------------------------------------------------

        cursor.execute(
            '''
            SELECT
                "id",
                "status",
                "name",
                "brand",
                "model",
                "memory",
                "price",
                "condition",
                "createdAt"
            FROM "ProductDraft"
            WHERE
                LOWER(TRIM("name")) = %s
                AND LOWER(TRIM(COALESCE("brand", ''))) = %s
                AND LOWER(TRIM(COALESCE("model", ''))) = %s
                AND LOWER(
                    REPLACE(
                        TRIM(
                            COALESCE("memory", '')
                        ),
                        ' ',
                        ''
                    )
                ) = %s
                AND LOWER(
                    TRIM(
                        COALESCE("condition", '')
                    )
                ) = %s
                AND "price" = %s
                AND "status" IN ('PENDING', 'APPROVED')
            ORDER BY "createdAt" DESC
            LIMIT 1
            ''',
            (
                name,
                brand,
                model,
                memory,
                condition,
                price,
            ),
        )

        result = cursor.fetchone()

        if result:
            return result

        # -------------------------------------------------
        # 2. БОЛЕЕ МЯГКИЙ ПОИСК
        # -------------------------------------------------
        #
        # Используется на случай небольших различий
        # в памяти или состоянии.
        #
        # Например:
        #
        # 256 GB
        # 256GB
        #
        # или:
        #
        # Б/У
        # used
        #
        # -------------------------------------------------

        cursor.execute(
            '''
            SELECT
                "id",
                "status",
                "name",
                "brand",
                "model",
                "memory",
                "price",
                "condition",
                "createdAt"
            FROM "ProductDraft"
            WHERE
                LOWER(TRIM("name")) = %s
                AND LOWER(TRIM(COALESCE("brand", ''))) = %s
                AND LOWER(TRIM(COALESCE("model", ''))) = %s
                AND "price" = %s
                AND "status" IN ('PENDING', 'APPROVED')
            ORDER BY "createdAt" DESC
            LIMIT 10
            ''',
            (
                name,
                brand,
                model,
                price,
            ),
        )

        candidates = cursor.fetchall()

        for candidate in candidates:

            candidate_memory = normalize_memory(
                candidate[5]
            )

            candidate_condition = normalize_condition(
                candidate[7]
            )

            if (
                candidate_memory == memory
                and candidate_condition == condition
            ):
                return candidate

        return None

    finally:

        cursor.close()

        if own_connection:
            connection.close()


# =========================================================
# UNIVERSAL DUPLICATE SEARCH
# =========================================================

def find_duplicate(
    product: dict[str, Any],
    connection=None,
):
    """
    Полная проверка товара на дубликат.

    Порядок проверки:

    1. Fingerprint
    2. Старые активные ProductDraft
    3. Если ничего не найдено → товар новый

    Только записи со статусами:

        PENDING
        APPROVED

    считаются активными.

    REJECTED / ERROR / DUPLICATE
    не блокируют повторный импорт.
    """

    own_connection = False

    if connection is None:
        connection = get_connection()
        own_connection = True

    try:

        fingerprint = calculate_fingerprint(
            product
        )

        # -------------------------------------------------
        # 1. FINGERPRINT
        # -------------------------------------------------

        result = find_by_fingerprint(
            fingerprint,
            connection=connection,
        )

        if result:

            return {
                "is_duplicate": True,
                "method": "fingerprint",
                "fingerprint": fingerprint,
                "draft": result,
            }

        # -------------------------------------------------
        # 2. SIMILARITY
        # -------------------------------------------------

        result = find_similar_draft(
            product,
            connection=connection,
        )

        if result:

            return {
                "is_duplicate": True,
                "method": "similarity",
                "fingerprint": fingerprint,
                "draft": result,
            }

        # -------------------------------------------------
        # NO DUPLICATE
        # -------------------------------------------------

        return {
            "is_duplicate": False,
            "method": None,
            "fingerprint": fingerprint,
            "draft": None,
        }

    finally:

        if own_connection:
            connection.close()


# =========================================================
# TEST
# =========================================================

if __name__ == "__main__":

    from config import ENRICHED_PRODUCT_FILE

    print()

    print("=" * 70)
    print("TECHSTORE DUPLICATE CHECKER")
    print("=" * 70)

    print()

    if not ENRICHED_PRODUCT_FILE.exists():

        raise FileNotFoundError(
            f"Файл не найден:\n"
            f"{ENRICHED_PRODUCT_FILE}"
        )

    with open(
        ENRICHED_PRODUCT_FILE,
        "r",
        encoding="utf-8",
    ) as file:

        product = json.load(file)

    fingerprint = calculate_fingerprint(
        product
    )

    print(
        f"Товар:        "
        f"{product.get('name', '—')}"
    )

    print(
        f"Модель:       "
        f"{product.get('model', '—')}"
    )

    print(
        f"Память:       "
        f"{product.get('memory', '—')}"
    )

    print(
        f"Состояние:    "
        f"{product.get('condition', '—')}"
    )

    print(
        f"Цена:         "
        f"{product.get('price', '—')} ₽"
    )

    print(
        f"Категория:    "
        f"{product.get('category', '—')}"
    )

    print(
        f"Fingerprint:  "
        f"{fingerprint}"
    )

    print()

    result = find_duplicate(
        product
    )

    if result["is_duplicate"]:

        draft = result["draft"]

        print(
            "⚠ ДУБЛИКАТ НАЙДЕН"
        )

        print()

        print(
            f"Метод:        "
            f"{result['method']}"
        )

        print(
            f"Draft ID:     "
            f"{draft[0]}"
        )

        print(
            f"Status:       "
            f"{draft[1]}"
        )

        print(
            f"Название:     "
            f"{draft[2]}"
        )

        print(
            f"Бренд:        "
            f"{draft[3]}"
        )

        print(
            f"Модель:       "
            f"{draft[4]}"
        )

        print(
            f"Память:       "
            f"{draft[5]}"
        )

        print(
            f"Цена:         "
            f"{draft[6]} ₽"
        )

        print()

        print(
            "Новый ProductDraft создавать НЕ нужно."
        )

    else:

        print(
            "✓ Дубликат не найден."
        )

        print(
            "✓ Товар можно создавать."
        )

    print()

    print("=" * 70)
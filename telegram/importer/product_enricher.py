from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from config import (
    PRODUCT_DRAFT_FILE,
    ENRICHED_PRODUCT_FILE,
)


# =========================================================
# HELPERS
# =========================================================

def load_json(path: Path) -> dict[str, Any]:
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
            f"Файл должен содержать JSON-объект:\n{path}"
        )

    return data


def save_json(
    data: dict[str, Any],
    path: Path,
) -> None:

    path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    with open(
        path,
        "w",
        encoding="utf-8",
    ) as file:

        json.dump(
            data,
            file,
            ensure_ascii=False,
            indent=2,
        )


def clean_string(value: Any) -> str:
    if value is None:
        return ""

    return str(value).strip()


def normalize_confidence(
    value: Any,
) -> float | None:

    if value is None:
        return None

    try:
        confidence = float(value)
    except (TypeError, ValueError):
        return None

    # Если вдруг значение пришло как 90.2,
    # превращаем в 0.902.
    if confidence > 1:
        confidence /= 100

    return max(
        0.0,
        min(1.0, confidence),
    )


# =========================================================
# CATEGORY
# =========================================================

def detect_category(
    product: dict[str, Any],
) -> str:

    existing = clean_string(
        product.get("category")
    )

    if existing:
        return existing

    text = " ".join(
        [
            clean_string(product.get("name")),
            clean_string(product.get("brand")),
            clean_string(product.get("model")),
            clean_string(product.get("description")),
        ]
    ).lower()

    # -----------------------------------------------------
    # PHONES
    # -----------------------------------------------------

    phone_words = [
        "iphone",
        "смартфон",
        "телефон",
        "galaxy s",
        "galaxy a",
        "pixel",
        "redmi note",
        "xiaomi",
        "poco",
        "oneplus",
        "honor",
    ]

    if any(
        word in text
        for word in phone_words
    ):
        return "phones"

    # -----------------------------------------------------
    # TABLETS
    # -----------------------------------------------------

    tablet_words = [
        "ipad",
        "планшет",
        "galaxy tab",
        "tablet",
        "xiaomi pad",
    ]

    if any(
        word in text
        for word in tablet_words
    ):
        return "tablets"

    # -----------------------------------------------------
    # CHARGERS
    # -----------------------------------------------------

    charger_words = [
        "зарядка",
        "зарядное устройство",
        "charger",
        "power adapter",
        "адаптер питания",
    ]

    if any(
        word in text
        for word in charger_words
    ):
        return "chargers"

    # -----------------------------------------------------
    # CABLES
    # -----------------------------------------------------

    cable_words = [
        "кабель",
        "cable",
        "usb-c",
        "type-c",
        "lightning",
    ]

    if any(
        word in text
        for word in cable_words
    ):
        return "cables"

    # -----------------------------------------------------
    # HEADPHONES
    # -----------------------------------------------------

    headphone_words = [
        "airpods",
        "наушники",
        "headphones",
        "earbuds",
        "buds",
    ]

    if any(
        word in text
        for word in headphone_words
    ):
        return "headphones"

    # -----------------------------------------------------
    # SMARTWATCHES
    # -----------------------------------------------------

    watch_words = [
        "apple watch",
        "galaxy watch",
        "smart watch",
        "смарт-часы",
        "умные часы",
    ]

    if any(
        word in text
        for word in watch_words
    ):
        return "watches"

    # -----------------------------------------------------
    # LAPTOPS
    # -----------------------------------------------------

    laptop_words = [
        "macbook",
        "ноутбук",
        "laptop",
        "thinkpad",
        "vivobook",
        "zenbook",
    ]

    if any(
        word in text
        for word in laptop_words
    ):
        return "laptops"

    # -----------------------------------------------------
    # CASES
    # -----------------------------------------------------

    case_words = [
        "чехол",
        "case",
        "кейс",
    ]

    if any(
        word in text
        for word in case_words
    ):
        return "cases"

    # -----------------------------------------------------
    # OTHER
    # -----------------------------------------------------

    return "other"


# =========================================================
# RESEARCH
# =========================================================

def research_product(
    product: dict[str, Any],
) -> dict[str, Any]:

    name = clean_string(
        product.get("name")
    )

    brand = clean_string(
        product.get("brand")
    )

    model = clean_string(
        product.get("model")
    )

    memory = clean_string(
        product.get("memory")
    )

    condition = clean_string(
        product.get("condition")
    )

    price = product.get("price")

    # -----------------------------------------------------
    # DEFAULT RESEARCH
    # -----------------------------------------------------

    result = {
        "researchVerified": False,
        "researchSource": None,
        "researchUrl": None,

        "display": product.get("display"),
        "processor": product.get("processor"),
        "camera": product.get("camera"),
        "sim": product.get("sim"),
        "year": product.get("year"),
    }

    # -----------------------------------------------------
    # IPHONE 14
    # -----------------------------------------------------

    normalized_model = model.lower()

    if (
        "iphone 14" in normalized_model
        and brand.lower() == "apple"
    ):

        result.update(
            {
                "display": "6.1″ Super Retina XDR OLED",

                "processor": "Apple A15 Bionic",

                "camera": (
                    "12 Мп основная камера + "
                    "12 Мп сверхширокоугольная"
                ),

                "sim": "Dual SIM / eSIM",

                "year": 2022,

                "researchVerified": True,

                "researchSource": "Apple Support",

                "researchUrl": (
                    "https://support.apple.com/de-ch/111850"
                ),
            }
        )

    # -----------------------------------------------------
    # DESCRIPTION
    # -----------------------------------------------------

    description_parts: list[str] = []

    if memory:
        description_parts.append(
            f"Память: {memory}."
        )

    if condition:
        description_parts.append(
            f"Состояние: {condition}."
        )

    if result["display"]:
        description_parts.append(
            f"Дисплей: {result['display']}."
        )

    if result["processor"]:
        description_parts.append(
            f"Процессор: {result['processor']}."
        )

    if result["camera"]:
        description_parts.append(
            f"Камера: {result['camera']}."
        )

    if price:
        description_parts.append(
            f"Цена: {price} ₽."
        )

    if result["researchVerified"]:
        description_parts.append(
            "Характеристики проверены по "
            "официальному источнику производителя."
        )

    description = " ".join(
        description_parts
    ).strip()

    if description:
        product["description"] = description

    # -----------------------------------------------------
    # APPLY RESEARCH
    # -----------------------------------------------------

    product["display"] = result["display"]
    product["processor"] = result["processor"]
    product["camera"] = result["camera"]
    product["sim"] = result["sim"]
    product["year"] = result["year"]

    product["researchVerified"] = (
        result["researchVerified"]
    )

    product["researchSource"] = (
        result["researchSource"]
    )

    product["researchUrl"] = (
        result["researchUrl"]
    )

    return product


# =========================================================
# MAIN
# =========================================================

def main() -> None:

    print()

    print("=" * 70)
    print("TECHSTORE PRODUCT ENRICHER")
    print("=" * 70)

    print()

    # -----------------------------------------------------
    # LOAD OCR DRAFT
    # -----------------------------------------------------

    product = load_json(
        PRODUCT_DRAFT_FILE
    )

    # -----------------------------------------------------
    # PRESERVE OCR DATA
    # -----------------------------------------------------

    # Это ключевое исправление.
    #
    # ocr.py уже рассчитывает confidence,
    # но раньше product_enricher.py его терял.

    confidence = normalize_confidence(
        product.get("ocrConfidence")
    )

    # Иногда OCR-скрипт может положить confidence
    # внутрь отдельного поля confidence.
    if confidence is None:

        confidence = normalize_confidence(
            product.get("confidence")
        )

    product["ocrConfidence"] = confidence

    # -----------------------------------------------------
    # CATEGORY
    # -----------------------------------------------------

    category = detect_category(
        product
    )

    product["category"] = category

    # -----------------------------------------------------
    # IMAGES
    # -----------------------------------------------------

    images = product.get("images")

    if not isinstance(images, list):
        images = []

    product["images"] = [
        clean_string(image)
        for image in images
        if clean_string(image)
    ]

    # -----------------------------------------------------
    # RESEARCH
    # -----------------------------------------------------

    product = research_product(
        product
    )

    # -----------------------------------------------------
    # META
    # -----------------------------------------------------

    product["enrichment"] = {
        "categoryDetected": True,
        "researchCompleted": True,
        "ocrConfidencePreserved": (
            confidence is not None
        ),
    }

    # -----------------------------------------------------
    # SAVE
    # -----------------------------------------------------

    save_json(
        product,
        ENRICHED_PRODUCT_FILE,
    )

    # -----------------------------------------------------
    # OUTPUT
    # -----------------------------------------------------

    print(
        f"Название:       "
        f"{product.get('name', '—')}"
    )

    print(
        f"Бренд:          "
        f"{product.get('brand', '—')}"
    )

    print(
        f"Модель:         "
        f"{product.get('model', '—')}"
    )

    print(
        f"Категория:      "
        f"{product.get('category', '—')}"
    )

    print(
        f"Память:         "
        f"{product.get('memory', '—')}"
    )

    print(
        f"Состояние:      "
        f"{product.get('condition', '—')}"
    )

    print(
        f"Цена:           "
        f"{product.get('price', '—')} ₽"
    )

    print(
        f"Фотографий:     "
        f"{len(product.get('images', []))}"
    )

    if confidence is None:

        print(
            "OCR confidence: —"
        )

    else:

        print(
            f"OCR confidence: "
            f"{confidence:.1%}"
        )

    print()

    if product.get("researchVerified"):

        print(
            "Research:       Проверено"
        )

        print(
            f"Источник:       "
            f"{product.get('researchSource', '—')}"
        )

    else:

        print(
            "Research:       Требует проверки"
        )

    print()

    print(
        "✓ Product enrichment завершён."
    )

    print()

    print(
        f"Файл:"
    )

    print(
        f"  {ENRICHED_PRODUCT_FILE}"
    )

    print()

    print("=" * 70)


if __name__ == "__main__":
    main()
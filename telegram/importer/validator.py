from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from config import (
    ENRICHED_PRODUCT_FILE,
    VALIDATION_FILE,
    OCR_MIN_CONFIDENCE,
)


# =========================================================
# LOAD
# =========================================================

def load_product(path: Path = ENRICHED_PRODUCT_FILE) -> dict[str, Any]:
    """
    Загружает обогащённый товар из JSON.
    """

    if not path.exists():
        raise FileNotFoundError(
            f"Файл товара не найден:\n{path}"
        )

    try:
        with open(path, "r", encoding="utf-8") as file:
            product = json.load(file)
    except json.JSONDecodeError as error:
        raise ValueError(
            f"Некорректный JSON в файле:\n{path}\n\n{error}"
        ) from error

    if not isinstance(product, dict):
        raise ValueError(
            "Файл товара должен содержать JSON-объект."
        )

    return product


# =========================================================
# HELPERS
# =========================================================

def clean_string(value: Any) -> str:
    """
    Безопасно приводит значение к строке.
    """

    if value is None:
        return ""

    return str(value).strip()


def safe_price(value: Any) -> int | None:
    """
    Безопасно преобразует цену в целое число.
    """

    if value is None:
        return None

    try:
        return int(float(value))
    except (TypeError, ValueError):
        return None


def get_images(product: dict[str, Any]) -> list[str]:
    """
    Возвращает корректный список изображений.
    """

    images = product.get("images")

    if not isinstance(images, list):
        return []

    result: list[str] = []

    for image in images:
        image_string = clean_string(image)

        if image_string:
            result.append(image_string)

    return result


def normalize_confidence(value: Any) -> float | None:
    """
    Приводит confidence к диапазону 0..1.
    """

    if value is None:
        return None

    try:
        confidence = float(value)
    except (TypeError, ValueError):
        return None

    # На случай, если где-то confidence записан как 90.2
    if confidence > 1:
        confidence = confidence / 100

    return max(0.0, min(1.0, confidence))


# =========================================================
# VALIDATION
# =========================================================

def validate_product(
    product: dict[str, Any],
) -> dict[str, Any]:
    """
    Проверяет товар перед отправкой в ProductDraft.

    Ошибки = товар нельзя импортировать.

    Предупреждения = товар импортировать можно,
    но желательно проверить его в админке.
    """

    errors: list[str] = []
    warnings: list[str] = []

    # -----------------------------------------------------
    # BASIC DATA
    # -----------------------------------------------------

    name = clean_string(product.get("name"))
    brand = clean_string(product.get("brand"))
    model = clean_string(product.get("model"))
    category = clean_string(product.get("category"))
    condition = clean_string(product.get("condition"))

    price = safe_price(product.get("price"))

    images = get_images(product)

    confidence = normalize_confidence(
        product.get("ocrConfidence")
    )

    # -----------------------------------------------------
    # NAME
    # -----------------------------------------------------

    if not name:
        errors.append(
            "Не указано название товара."
        )

    elif len(name) < 2:
        errors.append(
            "Название товара слишком короткое."
        )

    # -----------------------------------------------------
    # PRICE
    # -----------------------------------------------------

    if price is None:
        errors.append(
            "Цена отсутствует или имеет некорректный формат."
        )

    elif price <= 0:
        errors.append(
            "Цена должна быть больше 0 ₽."
        )

    elif price > 10_000_000:
        warnings.append(
            "Цена выглядит необычно высокой. "
            "Проверьте значение вручную."
        )

    # -----------------------------------------------------
    # IMAGES
    # -----------------------------------------------------

    if not images:
        errors.append(
            "У товара отсутствуют изображения."
        )

    else:
        if len(images) == 1:
            warnings.append(
                "У товара только одно изображение."
            )

        if len(images) > 10:
            warnings.append(
                "У товара слишком много изображений."
            )

        for index, image in enumerate(images, start=1):
            if not image.startswith("/uploads/"):
                warnings.append(
                    f"Изображение №{index} имеет необычный путь: "
                    f"{image}"
                )

    # -----------------------------------------------------
    # BRAND
    # -----------------------------------------------------

    if not brand:
        warnings.append(
            "Бренд не определён."
        )

    # -----------------------------------------------------
    # MODEL
    # -----------------------------------------------------

    if not model:
        warnings.append(
            "Модель не определена."
        )

    # -----------------------------------------------------
    # CATEGORY
    # -----------------------------------------------------

    if not category:
        warnings.append(
            "Категория не определена. "
            "Она будет определена автоматически."
        )

    # -----------------------------------------------------
    # CONDITION
    # -----------------------------------------------------

    if not condition:
        warnings.append(
            "Состояние товара не определено."
        )

    # -----------------------------------------------------
    # OCR CONFIDENCE
    # -----------------------------------------------------

    if confidence is None:

        warnings.append(
            "OCR confidence отсутствует."
        )

    else:

        if confidence < OCR_MIN_CONFIDENCE:

            warnings.append(
                "Низкая уверенность OCR: "
                f"{confidence:.1%}. "
                "Рекомендуется ручная проверка."
            )

        elif confidence < 0.80:

            warnings.append(
                "OCR confidence ниже 80%. "
                "Желательно проверить данные."
            )

    # -----------------------------------------------------
    # RESEARCH
    # -----------------------------------------------------

    research_verified = bool(
        product.get("researchVerified", False)
    )

    if not research_verified:

        warnings.append(
            "Характеристики товара не прошли "
            "внешнюю проверку."
        )

    # -----------------------------------------------------
    # DESCRIPTION
    # -----------------------------------------------------

    description = clean_string(
        product.get("description")
    )

    if not description:

        warnings.append(
            "Описание товара отсутствует."
        )

    # -----------------------------------------------------
    # SOURCE
    # -----------------------------------------------------

    source = product.get("source")

    if not source:

        warnings.append(
            "Источник товара не указан."
        )

    # -----------------------------------------------------
    # SCORE
    # -----------------------------------------------------

    score = 100

    # Ошибки очень сильно влияют на оценку.
    score -= min(
        len(errors) * 35,
        90,
    )

    # Предупреждения влияют мягче.
    score -= min(
        len(warnings) * 5,
        30,
    )

    score = max(
        0,
        min(100, score),
    )

    # -----------------------------------------------------
    # QUALITY
    # -----------------------------------------------------

    if errors:

        quality = "INVALID"

    elif score >= 85:

        quality = "GOOD"

    else:

        quality = "REVIEW"

    # -----------------------------------------------------
    # RESULT
    # -----------------------------------------------------

    result = {
        "valid": len(errors) == 0,

        "quality": quality,

        "score": score,

        "errors": errors,

        "warnings": warnings,

        "researchVerified": research_verified,

        "validatedAt": datetime.now(
            timezone.utc
        ).isoformat(),

        "summary": {
            "name": name,
            "brand": brand,
            "model": model,
            "category": category,
            "condition": condition,
            "price": price,
            "images": len(images),
            "ocrConfidence": confidence,
            "researchVerified": research_verified,
        },
    }

    return result


# =========================================================
# SAVE
# =========================================================

def save_validation(
    result: dict[str, Any],
    path: Path = VALIDATION_FILE,
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
            result,
            file,
            ensure_ascii=False,
            indent=2,
        )


# =========================================================
# CONSOLE
# =========================================================

def print_result(
    result: dict[str, Any],
) -> None:

    print()

    print("=" * 70)
    print("TECHSTORE PRODUCT VALIDATOR")
    print("=" * 70)

    print()

    print(
        f"Результат:        {result['quality']}"
    )

    print(
        f"Оценка качества:  {result['score']}/100"
    )

    print(
        f"Ошибок:            {len(result['errors'])}"
    )

    print(
        f"Предупреждений:    {len(result['warnings'])}"
    )

    print()

    summary = result["summary"]

    print(
        f"Название:          {summary['name'] or '—'}"
    )

    print(
        f"Бренд:             {summary['brand'] or '—'}"
    )

    print(
        f"Модель:            {summary['model'] or '—'}"
    )

    print(
        f"Категория:         {summary['category'] or 'будет определена'}"
    )

    print(
        f"Цена:              "
        f"{summary['price'] if summary['price'] is not None else '—'} ₽"
    )

    print(
        f"Фотографий:        {summary['images']}"
    )

    confidence = summary["ocrConfidence"]

    if confidence is None:

        print(
            "OCR confidence:    —"
        )

    else:

        print(
            f"OCR confidence:    {confidence:.1%}"
        )

    print()

    # -----------------------------------------------------
    # ERRORS
    # -----------------------------------------------------

    if result["errors"]:

        print("ОШИБКИ:")

        for error in result["errors"]:

            print(
                f"  ✗ {error}"
            )

        print()

    # -----------------------------------------------------
    # WARNINGS
    # -----------------------------------------------------

    if result["warnings"]:

        print("ПРЕДУПРЕЖДЕНИЯ:")

        for warning in result["warnings"]:

            print(
                f"  ⚠ {warning}"
            )

        print()

    # -----------------------------------------------------
    # FINAL
    # -----------------------------------------------------

    if result["quality"] == "GOOD":

        print(
            "✓ Товар прошёл проверку."
        )

        print(
            "✓ Можно отправлять в ProductDraft."
        )

    elif result["quality"] == "REVIEW":

        print(
            "⚠ Товар технически корректен,"
        )

        print(
            "  но рекомендуется проверить его в админке."
        )

    else:

        print(
            "✗ Товар НЕ МОЖЕТ быть импортирован."
        )

        print(
            "  Сначала необходимо исправить ошибки."
        )

    print()

    print(
        f"Результат сохранён:"
    )

    print(
        f"  {VALIDATION_FILE}"
    )

    print()

    print("=" * 70)


# =========================================================
# MAIN
# =========================================================

def main() -> None:

    product = load_product()

    result = validate_product(
        product
    )

    save_validation(
        result
    )

    print_result(
        result
    )

    # INVALID = ошибка пайплайна.
    #
    # Это важно для main.py:
    # если товар плохой, дальнейшее сохранение
    # в базу не выполняется.

    if not result["valid"]:

        raise SystemExit(1)


# =========================================================
# ENTRY POINT
# =========================================================

if __name__ == "__main__":
    main()
from pathlib import Path
from collections import Counter
import re
import json

import cv2  # type: ignore
import pytesseract  # type: ignore


# =========================================================
# ПУТИ
# =========================================================

BASE_DIR = Path(__file__).resolve().parent

FRAMES_DIR = BASE_DIR / "output" / "frames"

OCR_OUTPUT_FILE = BASE_DIR / "output" / "ocr_result.json"

DRAFT_OUTPUT_FILE = BASE_DIR / "output" / "product_draft.json"

IMAGES_OUTPUT_FILE = BASE_DIR / "output" / "product_images.json"


# =========================================================
# TESSERACT
# =========================================================

TESSERACT_PATH = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH


# =========================================================
# ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
# =========================================================

def clean_text(text: str) -> str:
    lines = []

    for line in text.splitlines():

        line = line.strip()

        if not line:
            continue

        line = re.sub(r"\s+", " ", line)

        lines.append(line)

    return "\n".join(lines)


# =========================================================
# ПРОВЕРКА TESSERACT
# =========================================================

def check_tesseract() -> None:

    tesseract_file = Path(TESSERACT_PATH)

    if not tesseract_file.exists():

        raise FileNotFoundError(
            "Tesseract OCR не найден.\n\n"
            f"Ожидаемый путь:\n"
            f"{tesseract_file}"
        )

    try:

        version = pytesseract.get_tesseract_version()

    except Exception as error:

        raise RuntimeError(
            "Tesseract найден, "
            "но не удалось его запустить.\n"
            f"{error}"
        ) from error

    print(f"Tesseract: {version}")
    print()


# =========================================================
# ЗАГРУЗКА ФОТОГРАФИЙ
# =========================================================

def load_product_images() -> tuple[list[str], list[dict]]:
    """
    Загружает выбранные фотографии из product_images.json.

    Поддерживает:

    1.
    [
        "/uploads/image1.jpg"
    ]

    2.
    {
        "images": [
            {
                "frame": "frame_0044.jpg",
                "score": 315.82,
                "path": "/uploads/image1.jpg"
            }
        ]
    }

    Возвращает:

    images
        Список URL фотографий.

    image_details
        Полную информацию о выбранных кадрах,
        включая frame, score и path.
    """

    if not IMAGES_OUTPUT_FILE.exists():

        print(
            "⚠ product_images.json не найден."
        )

        print(
            f"Ожидаемый путь: {IMAGES_OUTPUT_FILE}"
        )

        return [], []

    try:

        with open(
            IMAGES_OUTPUT_FILE,
            "r",
            encoding="utf-8",
        ) as file:

            data = json.load(file)

    except Exception as error:

        print(
            "⚠ Ошибка чтения product_images.json:"
        )

        print(error)

        return [], []

    images: list[str] = []

    image_details: list[dict] = []

    # =====================================================
    # ФОРМАТ 1
    # =====================================================

    if isinstance(data, list):

        for item in data:

            if not item:
                continue

            # -------------------------------------------------
            # Просто строка
            # -------------------------------------------------

            if isinstance(item, str):

                image_url = item.strip()

                if not image_url:
                    continue

                images.append(image_url)

                image_details.append(
                    {
                        "frame": None,
                        "score": None,
                        "path": image_url,
                    }
                )

                continue

            # -------------------------------------------------
            # Объект
            # -------------------------------------------------

            if isinstance(item, dict):

                path = item.get("path")

                if not path:
                    continue

                image_url = str(path).strip()

                if not image_url:
                    continue

                images.append(image_url)

                image_details.append(
                    {
                        "frame": item.get("frame"),
                        "score": item.get("score"),
                        "path": image_url,
                    }
                )

    # =====================================================
    # ФОРМАТ 2
    # =====================================================

    elif isinstance(data, dict):

        image_items = data.get("images")

        if not isinstance(image_items, list):

            print(
                "⚠ product_images.json содержит объект, "
                "но поле 'images' не является массивом."
            )

            return [], []

        for item in image_items:

            if not isinstance(item, dict):
                continue

            path = item.get("path")

            if not path:
                continue

            image_url = str(path).strip()

            if not image_url:
                continue

            images.append(image_url)

            image_details.append(
                {
                    "frame": item.get("frame"),
                    "score": item.get("score"),
                    "path": image_url,
                }
            )

    else:

        print(
            "⚠ Неизвестный формат product_images.json."
        )

        return [], []

    # =====================================================
    # УДАЛЕНИЕ ДУБЛИКАТОВ
    # =====================================================

    unique_images: list[str] = []

    unique_details: list[dict] = []

    seen = set()

    for detail in image_details:

        path = detail.get("path")

        if not path:
            continue

        if path in seen:
            continue

        seen.add(path)

        unique_images.append(path)

        unique_details.append(detail)

    images = unique_images

    image_details = unique_details

    # =====================================================
    # СОРТИРОВКА ПО SCORE
    # =====================================================

    # Самые качественные кадры идут первыми.
    #
    # Если score отсутствует, такой кадр
    # просто перемещается в конец.

    image_details.sort(
        key=lambda item: (
            item.get("score") is not None,
            float(item.get("score") or 0),
        ),
        reverse=True,
    )

    images = [
        item["path"]
        for item in image_details
    ]

    # =====================================================
    # ВЫВОД
    # =====================================================

    print(
        f"Загружено фотографий: {len(images)}"
    )

    for index, item in enumerate(
        image_details,
        start=1,
    ):

        print(
            f"  [{index}] "
            f"{item.get('path')}"
        )

        if item.get("frame"):

            print(
                f"      Кадр: {item.get('frame')}"
            )

        if item.get("score") is not None:

            print(
                f"      Score: {item.get('score')}"
            )

    print()

    return images, image_details


# =========================================================
# OCR IMAGE PREPARATION
# =========================================================

def prepare_image(image):

    gray = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2GRAY,
    )

    scale = 2

    enlarged = cv2.resize(
        gray,
        None,
        fx=scale,
        fy=scale,
        interpolation=cv2.INTER_CUBIC,
    )

    blurred = cv2.GaussianBlur(
        enlarged,
        (3, 3),
        0,
    )

    _, threshold = cv2.threshold(
        blurred,
        0,
        255,
        cv2.THRESH_BINARY + cv2.THRESH_OTSU,
    )

    return threshold


# =========================================================
# OCR
# =========================================================

def recognize_text(image_path: Path) -> str:

    image = cv2.imread(
        str(image_path)
    )

    if image is None:

        return ""

    prepared = prepare_image(
        image
    )

    config = "--psm 6"

    try:

        text = pytesseract.image_to_string(
            prepared,
            lang="rus+eng",
            config=config,
        )

    except Exception as error:

        print(
            f"⚠ Ошибка OCR "
            f"{image_path.name}: "
            f"{error}"
        )

        return ""

    return clean_text(text)


# =========================================================
# ЦЕНА
# =========================================================

def extract_prices(text: str) -> list[int]:

    candidates = []

    patterns = [

        r"(\d{1,3}(?:[ .]\d{3})+)\s*[₽РP]",

        r"(\d{2,6})\s*[₽РP]",
    ]

    for pattern in patterns:

        matches = re.findall(
            pattern,
            text,
            flags=re.IGNORECASE,
        )

        for match in matches:

            normalized = (
                match
                .replace(" ", "")
                .replace(".", "")
            )

            try:

                price = int(
                    normalized
                )

            except ValueError:

                continue

            if not (
                3000
                <= price
                <= 1000000
            ):

                continue

            if price in {
                14256,
                1425,
                142,
            }:

                continue

            candidates.append(
                price
            )

    return candidates


# =========================================================
# ПАМЯТЬ
# =========================================================

def extract_memory(text: str):

    patterns = [

        r"(\d+)\s*(GB|ГБ)",

        r"(\d+)\s*(TB|ТБ)",
    ]

    for pattern in patterns:

        match = re.search(
            pattern,
            text,
            flags=re.IGNORECASE,
        )

        if not match:
            continue

        value = match.group(1)

        unit = match.group(2).upper()

        if unit in {
            "GB",
            "ГБ",
        }:

            return f"{value} GB"

        if unit in {
            "TB",
            "ТБ",
        }:

            return f"{value} TB"

    return None


# =========================================================
# МОДЕЛЬ ТЕЛЕФОНА
# =========================================================

def extract_phone_model(text: str):

    patterns = [

        r"iPhone\s+\d+(?:\s+Pro(?:\s+Max)?|\s+Plus|\s+Mini)?",

        r"Samsung\s+Galaxy\s+S\d+(?:\s+Ultra|\s+Plus)?",

        r"Galaxy\s+S\d+(?:\s+Ultra|\s+Plus)?",

        r"Redmi\s+Note\s+\d+(?:\s+Pro(?:\s+Plus)?)?",

        r"Xiaomi\s+\d+(?:\s+Pro(?:\s+Max)?)?",
    ]

    for pattern in patterns:

        match = re.search(
            pattern,
            text,
            flags=re.IGNORECASE,
        )

        if not match:
            continue

        model = match.group(0)

        model = re.sub(
            r"\s+",
            " ",
            model,
        ).strip()

        if model.lower().startswith(
            "iphone"
        ):

            model = (
                "iPhone"
                + model[6:]
            )

        elif model.lower().startswith(
            "samsung"
        ):

            parts = model.split()

            model = " ".join(
                [
                    "Samsung",
                    *parts[1:],
                ]
            )

        elif model.lower().startswith(
            "galaxy"
        ):

            model = (
                "Samsung "
                + model
            )

        elif model.lower().startswith(
            "xiaomi"
        ):

            parts = model.split()

            model = " ".join(
                [
                    "Xiaomi",
                    *parts[1:],
                ]
            )

        elif model.lower().startswith(
            "redmi"
        ):

            model = (
                "Xiaomi "
                + model
            )

        return model

    return None


# =========================================================
# СОСТОЯНИЕ
# =========================================================

def detect_condition(text: str):

    normalized = (
        text
        .lower()
        .replace("ё", "е")
    )

    if (
        "после ремонта" in normalized
        or "ремонтирован" in normalized
    ):

        return "После ремонта"

    used_patterns = [
        "б/у",
        "б у",
        "бу",
        "как новый",
        "как новыи",
        "отличное состояние",
        "хорошее состояние",
        "идеальное состояние",
    ]

    for pattern in used_patterns:

        if pattern in normalized:

            return "Б/У"

    new_patterns = [
        "новый",
        "новое",
        "новая",
        "новые",
        "запечатан",
        "запечатанный",
    ]

    for pattern in new_patterns:

        if pattern in normalized:

            return "Новый"

    return None


# =========================================================
# MOST COMMON
# =========================================================

def most_common(values: list):

    values = [
        value
        for value in values
        if value is not None
    ]

    if not values:

        return None

    counter = Counter(values)

    return (
        counter
        .most_common(1)[0][0]
    )


# =========================================================
# CONFIDENCE
# =========================================================

def calculate_confidence(
    model_values: list,
    memory_values: list,
    price_values: list,
    condition_values: list,
    total_frames: int,
) -> float:

    if total_frames <= 0:

        return 0.0

    scores = []

    groups = [
        model_values,
        memory_values,
        price_values,
        condition_values,
    ]

    for values in groups:

        if not values:
            continue

        counter = Counter(values)

        count = (
            counter
            .most_common(1)[0][1]
        )

        scores.append(
            count / total_frames
        )

    if not scores:

        return 0.0

    confidence = (
        sum(scores)
        / len(scores)
    )

    return round(
        min(
            confidence,
            1.0,
        ),
        3,
    )


# =========================================================
# BRAND
# =========================================================

def detect_brand(
    model: str | None,
    text: str,
):

    normalized_text = (
        text
        .lower()
        .replace("ё", "е")
    )

    if model:

        normalized_model = (
            model.lower()
        )

        if normalized_model.startswith(
            "iphone"
        ):

            return "Apple"

        if "samsung" in normalized_model:

            return "Samsung"

        if "galaxy" in normalized_model:

            return "Samsung"

        if "xiaomi" in normalized_model:

            return "Xiaomi"

        if "redmi" in normalized_model:

            return "Xiaomi"

    if "apple" in normalized_text:

        return "Apple"

    if "samsung" in normalized_text:

        return "Samsung"

    if "xiaomi" in normalized_text:

        return "Xiaomi"

    if "redmi" in normalized_text:

        return "Xiaomi"

    return None


# =========================================================
# MAIN
# =========================================================

def main():

    # =====================================================
    # ПРОВЕРКИ
    # =====================================================

    if not FRAMES_DIR.exists():

        raise FileNotFoundError(
            "Папка с кадрами не найдена:\n"
            f"{FRAMES_DIR}"
        )

    frame_files = sorted(
        FRAMES_DIR.glob("*.jpg")
    )

    if not frame_files:

        raise RuntimeError(
            "В папке нет кадров для OCR."
        )

    # =====================================================
    # HEADER
    # =====================================================

    print("=" * 70)
    print("TECHSTORE STORY IMPORTER")
    print("OCR ANALYSIS")
    print("=" * 70)
    print()

    print(
        f"Найдено кадров: {len(frame_files)}"
    )

    print()

    # =====================================================
    # TESSERACT
    # =====================================================

    check_tesseract()

    # =====================================================
    # ФОТОГРАФИИ
    # =====================================================

    images, image_details = (
        load_product_images()
    )

    # =====================================================
    # РЕЗУЛЬТАТЫ
    # =====================================================

    results = []

    all_models = []
    all_memories = []
    all_prices = []
    all_conditions = []
    all_brands = []

    # =====================================================
    # OCR
    # =====================================================

    for index, frame_path in enumerate(
        frame_files,
        start=1,
    ):

        print(
            f"[{index}/{len(frame_files)}] "
            f"OCR: {frame_path.name}"
        )

        text = recognize_text(
            frame_path
        )

        prices = extract_prices(
            text
        )

        memory = extract_memory(
            text
        )

        model = extract_phone_model(
            text
        )

        condition = detect_condition(
            text
        )

        brand = detect_brand(
            model,
            text,
        )

        result = {
            "frame": frame_path.name,
            "text": text,
            "prices": prices,
            "memory": memory,
            "model": model,
            "brand": brand,
            "condition": condition,
        }

        results.append(
            result
        )

        if model:
            all_models.append(model)

        if brand:
            all_brands.append(brand)

        if memory:
            all_memories.append(memory)

        if condition:
            all_conditions.append(condition)

        for price in prices:
            all_prices.append(price)

        if model:
            print(
                f"  Модель: {model}"
            )

        if brand:
            print(
                f"  Бренд: {brand}"
            )

        if memory:
            print(
                f"  Память: {memory}"
            )

        if prices:
            print(
                f"  Цены: {prices}"
            )

        if condition:
            print(
                f"  Состояние: {condition}"
            )

        print()

    # =====================================================
    # ИТОГОВЫЕ ЗНАЧЕНИЯ
    # =====================================================

    final_model = most_common(
        all_models
    )

    final_brand = most_common(
        all_brands
    )

    final_memory = most_common(
        all_memories
    )

    final_price = most_common(
        all_prices
    )

    final_condition = most_common(
        all_conditions
    )

    confidence = calculate_confidence(
        model_values=all_models,
        memory_values=all_memories,
        price_values=all_prices,
        condition_values=all_conditions,
        total_frames=len(
            frame_files
        ),
    )

    # =====================================================
    # ОПИСАНИЕ
    # =====================================================

    description_parts = []

    if final_condition == "Б/У":

        description_parts.append(
            "Товар с пробегом."
        )

    elif final_condition == "После ремонта":

        description_parts.append(
            "Устройство после ремонта."
        )

    elif final_condition == "Новый":

        description_parts.append(
            "Новый товар."
        )

    description = " ".join(
        description_parts
    )

    # =====================================================
    # PRODUCT DRAFT
    # =====================================================

    product_draft = {

        "name": final_model,

        "brand": final_brand,

        "model": final_model,

        "memory": final_memory,

        "condition": final_condition,

        "price": final_price,

        "description": (
            description
            or None
        ),

        # -------------------------------------------------
        # Простые URL фотографий
        # -------------------------------------------------

        "images": images,

        # -------------------------------------------------
        # Полная информация о фотографиях
        # -------------------------------------------------

        "imageDetails": image_details,

        # -------------------------------------------------
        # Источник
        # -------------------------------------------------

        "source": {

            "type": "telegram_story",

            "video": "media/story.mp4",
        },

        # -------------------------------------------------
        # Уверенность
        # -------------------------------------------------

        "confidence": confidence,

        # -------------------------------------------------
        # Статистика
        # -------------------------------------------------

        "statistics": {

            "frames_analyzed": len(
                frame_files
            ),

            "models": dict(
                Counter(
                    all_models
                )
            ),

            "brands": dict(
                Counter(
                    all_brands
                )
            ),

            "memories": dict(
                Counter(
                    all_memories
                )
            ),

            "prices": dict(
                Counter(
                    all_prices
                )
            ),

            "conditions": dict(
                Counter(
                    all_conditions
                )
            ),

            "selected_images": len(
                image_details
            ),
        },
    }

    # =====================================================
    # СОХРАНЕНИЕ OCR
    # =====================================================

    OCR_OUTPUT_FILE.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    with open(
        OCR_OUTPUT_FILE,
        "w",
        encoding="utf-8",
    ) as file:

        json.dump(
            results,
            file,
            ensure_ascii=False,
            indent=2,
        )

    # =====================================================
    # СОХРАНЕНИЕ PRODUCT DRAFT
    # =====================================================

    with open(
        DRAFT_OUTPUT_FILE,
        "w",
        encoding="utf-8",
    ) as file:

        json.dump(
            product_draft,
            file,
            ensure_ascii=False,
            indent=2,
        )

    # =====================================================
    # РЕЗУЛЬТАТ
    # =====================================================

    print("=" * 70)
    print("OCR ЗАВЕРШЁН")
    print("=" * 70)

    print()

    print("ИТОГОВЫЙ ТОВАР:")

    print()

    print(
        f"Название:    {final_model}"
    )

    print(
        f"Бренд:       {final_brand}"
    )

    print(
        f"Память:      {final_memory}"
    )

    print(
        f"Состояние:   {final_condition}"
    )

    print(
        f"Цена:        {final_price} ₽"
    )

    print(
        f"Уверенность: "
        f"{confidence * 100:.1f}%"
    )

    print(
        f"Фотографий:  "
        f"{len(images)}"
    )

    print()

    # =====================================================
    # МОДЕЛИ
    # =====================================================

    print("Модели:")

    for value, count in (
        Counter(
            all_models
        )
        .most_common()
    ):

        print(
            f"  {value}: {count}"
        )

    print()

    # =====================================================
    # БРЕНДЫ
    # =====================================================

    print("Бренды:")

    for value, count in (
        Counter(
            all_brands
        )
        .most_common()
    ):

        print(
            f"  {value}: {count}"
        )

    print()

    # =====================================================
    # ПАМЯТЬ
    # =====================================================

    print("Память:")

    for value, count in (
        Counter(
            all_memories
        )
        .most_common()
    ):

        print(
            f"  {value}: {count}"
        )

    print()

    # =====================================================
    # ЦЕНЫ
    # =====================================================

    print("Цены:")

    for value, count in (
        Counter(
            all_prices
        )
        .most_common()
    ):

        print(
            f"  {value} ₽: {count}"
        )

    print()

    # =====================================================
    # СОСТОЯНИЕ
    # =====================================================

    print("Состояние:")

    for value, count in (
        Counter(
            all_conditions
        )
        .most_common()
    ):

        print(
            f"  {value}: {count}"
        )

    print()

    # =====================================================
    # ФОТОГРАФИИ
    # =====================================================

    print("Фотографии:")

    if image_details:

        for index, item in enumerate(
            image_details,
            start=1,
        ):

            print(
                f"  [{index}] "
                f"{item.get('path')}"
            )

            if item.get("frame"):

                print(
                    f"      Кадр: "
                    f"{item.get('frame')}"
                )

            if item.get("score") is not None:

                print(
                    f"      Score: "
                    f"{item.get('score')}"
                )

    else:

        print(
            "  Фотографии отсутствуют."
        )

    print()

    # =====================================================
    # ФАЙЛЫ
    # =====================================================

    print("-" * 70)

    print()

    print("OCR JSON:")

    print(
        OCR_OUTPUT_FILE
    )

    print()

    print("PRODUCT DRAFT:")

    print(
        DRAFT_OUTPUT_FILE
    )

    print()

    print("=" * 70)


# =========================================================
# START
# =========================================================

if __name__ == "__main__":

    main()
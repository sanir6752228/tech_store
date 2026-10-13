from __future__ import annotations

import json
import re
import shutil
from pathlib import Path

import cv2 # type: ignore


# ============================================================
# TECHSTORE IMAGE SELECTOR
# Универсальный выбор лучших кадров из видео
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

OUTPUT_DIR = BASE_DIR / "output"
FRAMES_DIR = OUTPUT_DIR / "frames"

PRODUCT_DRAFT_FILE = OUTPUT_DIR / "product_draft.json"
PRODUCT_IMAGES_FILE = OUTPUT_DIR / "product_images.json"

# C:\project\tech_store\public
PUBLIC_DIR = BASE_DIR.parent.parent / "public"

# C:\project\tech_store\public\uploads\imports
UPLOADS_DIR = PUBLIC_DIR / "uploads" / "imports"

MAX_IMAGES = 3
MIN_FRAME_DISTANCE = 5


# ============================================================
# TRANSLITERATION
# ============================================================

TRANSLITERATION = {
    "а": "a",
    "б": "b",
    "в": "v",
    "г": "g",
    "д": "d",
    "е": "e",
    "ё": "e",
    "ж": "zh",
    "з": "z",
    "и": "i",
    "й": "y",
    "к": "k",
    "л": "l",
    "м": "m",
    "н": "n",
    "о": "o",
    "п": "p",
    "р": "r",
    "с": "s",
    "т": "t",
    "у": "u",
    "ф": "f",
    "х": "h",
    "ц": "c",
    "ч": "ch",
    "ш": "sh",
    "щ": "shch",
    "ъ": "",
    "ы": "y",
    "ь": "",
    "э": "e",
    "ю": "yu",
    "я": "ya",
}


def create_slug(text: str) -> str:
    """
    Создаёт безопасный slug из названия товара.

    Примеры:

    iPhone 14
    -> iphone-14

    Samsung Galaxy S25
    -> samsung-galaxy-s25

    Xiaomi Redmi Note 14
    -> xiaomi-redmi-note-14

    iPad Pro M4
    -> ipad-pro-m4
    """

    if not text:
        return "product"

    text = str(text).strip().lower()

    text = "".join(
        TRANSLITERATION.get(char, char)
        for char in text
    )

    text = re.sub(
        r"[^a-z0-9]+",
        "-",
        text,
    )

    text = re.sub(
        r"-+",
        "-",
        text,
    )

    text = text.strip("-")

    if not text:
        return "product"

    return text


# ============================================================
# PRODUCT NAME
# ============================================================

def load_product_draft() -> dict:
    """
    Загружает текущий product_draft.json.
    """

    if not PRODUCT_DRAFT_FILE.exists():
        return {}

    try:
        with PRODUCT_DRAFT_FILE.open(
            "r",
            encoding="utf-8",
        ) as file:
            data = json.load(file)

        if isinstance(data, dict):
            return data

    except Exception as error:
        print(
            f"⚠ Ошибка чтения product_draft.json: {error}"
        )

    return {}


def get_product_name(product_draft: dict) -> str:
    """
    Определяет название товара.
    """

    name = (
        product_draft.get("name")
        or product_draft.get("model")
        or product_draft.get("brand")
    )

    if name:
        return str(name).strip()

    return "product"


# ============================================================
# IMAGE QUALITY
# ============================================================

def calculate_sharpness(image) -> float:
    """
    Резкость кадра.
    """

    gray = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2GRAY,
    )

    return float(
        cv2.Laplacian(
            gray,
            cv2.CV_64F,
        ).var()
    )


def calculate_brightness(image) -> float:
    """
    Средняя яркость.
    """

    gray = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2GRAY,
    )

    return float(gray.mean())


def calculate_contrast(image) -> float:
    """
    Контраст.
    """

    gray = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2GRAY,
    )

    return float(gray.std())


def calculate_score(image) -> float:
    """
    Итоговая оценка качества кадра.
    """

    sharpness = calculate_sharpness(image)
    brightness = calculate_brightness(image)
    contrast = calculate_contrast(image)

    # Оптимальная яркость примерно посередине.
    brightness_score = max(
        0.0,
        100.0 - abs(brightness - 128.0),
    )

    score = (
        sharpness * 0.65
        + contrast * 0.20
        + brightness_score * 0.15
    )

    return float(score)


# ============================================================
# FRAMES
# ============================================================

def get_frames() -> list[Path]:
    """
    Получает все JPG кадры.
    """

    if not FRAMES_DIR.exists():
        return []

    return sorted(
        FRAMES_DIR.glob("*.jpg")
    )


def get_frame_number(frame_path: Path) -> int:
    """
    frame_0035.jpg -> 35
    """

    try:
        return int(
            frame_path.stem.split("_")[-1]
        )
    except (ValueError, IndexError):
        return 0


# ============================================================
# SAVE PRODUCT DRAFT
# ============================================================

def update_product_draft(
    product_draft: dict,
    product_name: str,
    product_slug: str,
    images: list[dict],
) -> None:
    """
    Обновляет product_draft.json актуальными изображениями.
    """

    product_draft["name"] = product_name
    product_draft["images"] = [
        image["path"]
        for image in images
    ]
    product_draft["imageCount"] = len(images)
    product_draft["imageSlug"] = product_slug

    with PRODUCT_DRAFT_FILE.open(
        "w",
        encoding="utf-8",
    ) as file:
        json.dump(
            product_draft,
            file,
            ensure_ascii=False,
            indent=2,
        )


# ============================================================
# MAIN
# ============================================================

def main() -> int:

    print("=" * 70)
    print("TECHSTORE IMAGE SELECTOR")
    print("=" * 70)

    # --------------------------------------------------------
    # Проверяем папки
    # --------------------------------------------------------

    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    UPLOADS_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    # --------------------------------------------------------
    # Загружаем OCR draft
    # --------------------------------------------------------

    product_draft = load_product_draft()

    product_name = get_product_name(
        product_draft
    )

    product_slug = create_slug(
        product_name
    )

    print()
    print(f"Товар:       {product_name}")
    print(f"Slug:        {product_slug}")

    # --------------------------------------------------------
    # Загружаем кадры
    # --------------------------------------------------------

    frames = get_frames()

    print()
    print(
        f"Найдено кадров: {len(frames)}"
    )

    if not frames:
        print()
        print("❌ Кадры не найдены.")
        print(
            f"Папка: {FRAMES_DIR}"
        )

        return 1

    # --------------------------------------------------------
    # Анализируем кадры
    # --------------------------------------------------------

    candidates = []

    print()
    print("Анализ кадров...")

    for frame_path in frames:

        image = cv2.imread(
            str(frame_path)
        )

        if image is None:
            continue

        score = calculate_score(
            image
        )

        frame_number = get_frame_number(
            frame_path
        )

        candidates.append(
            {
                "path": frame_path,
                "score": score,
                "frame": frame_number,
            }
        )

    if not candidates:
        print()
        print("❌ Ни один кадр не удалось обработать.")

        return 1

    # --------------------------------------------------------
    # Сортировка по качеству
    # --------------------------------------------------------

    candidates.sort(
        key=lambda item: item["score"],
        reverse=True,
    )

    # --------------------------------------------------------
    # Выбор разнообразных кадров
    # --------------------------------------------------------

    selected = []

    for candidate in candidates:

        if len(selected) >= MAX_IMAGES:
            break

        current_frame = candidate["frame"]

        too_close = any(
            abs(
                current_frame
                - selected_item["frame"]
            )
            < MIN_FRAME_DISTANCE
            for selected_item in selected
        )

        if too_close:
            continue

        selected.append(
            candidate
        )

    # --------------------------------------------------------
    # Если не набрали 3 — добираем лучшие
    # --------------------------------------------------------

    if len(selected) < MAX_IMAGES:

        for candidate in candidates:

            if len(selected) >= MAX_IMAGES:
                break

            if candidate in selected:
                continue

            selected.append(
                candidate
            )

    # --------------------------------------------------------
    # Папка товара
    # --------------------------------------------------------

    product_dir = (
        UPLOADS_DIR
        / product_slug
    )

    # Старые фотографии этого товара удаляем.
    # Это предотвращает накопление старых изображений.

    if product_dir.exists():

        print()
        print(
            f"Удаляем старые изображения:"
        )
        print(
            f"  {product_dir}"
        )

        shutil.rmtree(
            product_dir
        )

    product_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    # --------------------------------------------------------
    # Копируем выбранные изображения
    # --------------------------------------------------------

    result_images = []

    print()
    print("Выбранные фотографии:")

    for index, candidate in enumerate(
        selected,
        start=1,
    ):

        source = candidate["path"]

        filename = (
            f"{product_slug}-{index}.jpg"
        )

        destination = (
            product_dir
            / filename
        )

        shutil.copy2(
            source,
            destination,
        )

        public_url = (
            f"/uploads/imports/"
            f"{product_slug}/"
            f"{filename}"
        )

        result_images.append(
            {
                "frame": source.name,
                "score": round(
                    candidate["score"],
                    2,
                ),
                "path": public_url,
            }
        )

        print(
            f"  {index}. "
            f"{source.name}"
        )

        print(
            f"     → {filename}"
        )

        print(
            f"     score: "
            f"{candidate['score']:.2f}"
        )

    # --------------------------------------------------------
    # Сохраняем product_images.json
    # --------------------------------------------------------

    images_result = {
        "productName": product_name,
        "productSlug": product_slug,
        "count": len(result_images),
        "images": result_images,
    }

    with PRODUCT_IMAGES_FILE.open(
        "w",
        encoding="utf-8",
    ) as file:

        json.dump(
            images_result,
            file,
            ensure_ascii=False,
            indent=2,
        )

    # --------------------------------------------------------
    # Обновляем product_draft.json
    # --------------------------------------------------------

    try:

        update_product_draft(
            product_draft=product_draft,
            product_name=product_name,
            product_slug=product_slug,
            images=result_images,
        )

        print()
        print(
            "✓ product_draft.json обновлён"
        )

    except Exception as error:

        print()
        print(
            f"❌ Не удалось обновить "
            f"product_draft.json: {error}"
        )

        return 1

    # --------------------------------------------------------
    # Финал
    # --------------------------------------------------------

    print()
    print(
        f"✓ Изображений сохранено: "
        f"{len(result_images)}"
    )

    print()
    print(
        "Папка товара:"
    )

    print(
        f"  {product_dir}"
    )

    print()
    print(
        "JSON:"
    )

    print(
        f"  {PRODUCT_IMAGES_FILE}"
    )

    print()
    print("=" * 70)
    print("IMAGE SELECTOR SUCCESS")
    print("=" * 70)

    return 0


if __name__ == "__main__":
    raise SystemExit(
        main()
    )
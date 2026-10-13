from pathlib import Path
import os

from dotenv import load_dotenv


# =========================================================
# BASE PATHS
# =========================================================

BASE_DIR = Path(__file__).resolve().parent

# C:\project\tech_store
PROJECT_DIR = BASE_DIR.parent.parent

ENV_FILE = PROJECT_DIR / ".env.local"


# =========================================================
# ENVIRONMENT
# =========================================================

load_dotenv(ENV_FILE)

DATABASE_URL = os.getenv("DATABASE_URL")


# =========================================================
# IMPORTER DIRECTORIES
# =========================================================

OUTPUT_DIR = BASE_DIR / "output"

FRAMES_DIR = OUTPUT_DIR / "frames"

MEDIA_DIR = BASE_DIR / "media"

LOGS_DIR = BASE_DIR / "logs"


# =========================================================
# IMPORTER FILES
# =========================================================

PRODUCT_DRAFT_FILE = (
    OUTPUT_DIR / "product_draft.json"
)

ENRICHED_PRODUCT_FILE = (
    OUTPUT_DIR / "enriched_product.json"
)

VALIDATION_FILE = (
    OUTPUT_DIR / "validation.json"
)

IMPORT_RESULT_FILE = (
    OUTPUT_DIR / "import_result.json"
)


# =========================================================
# IMPORT SETTINGS
# =========================================================

# Минимальная допустимая уверенность OCR.
#
# 0.65 = 65%
#
# Если OCR распознал товар хуже этого значения,
# система покажет предупреждение.
#
OCR_MIN_CONFIDENCE = float(
    os.getenv(
        "TECHSTORE_OCR_MIN_CONFIDENCE",
        "0.65",
    )
)


# Максимальное количество фотографий товара.
#
# Сейчас у нас 3 фотографии:
#
# 1. iphone-14-1.jpg
# 2. iphone-14-2.jpg
# 3. iphone-14-3.jpg
#
MAX_IMAGES = int(
    os.getenv(
        "TECHSTORE_MAX_IMAGES",
        "3",
    )
)


# =========================================================
# CREATE DIRECTORIES
# =========================================================

for directory in (
    OUTPUT_DIR,
    FRAMES_DIR,
    MEDIA_DIR,
    LOGS_DIR,
):
    directory.mkdir(
        parents=True,
        exist_ok=True,
    )


# =========================================================
# STARTUP CHECK
# =========================================================

if __name__ == "__main__":

    print()
    print("=" * 70)
    print("TECHSTORE IMPORTER CONFIG")
    print("=" * 70)
    print()

    print(
        f"Проект:        {PROJECT_DIR}"
    )

    print(
        f"Importer:      {BASE_DIR}"
    )

    print(
        f".env.local:    {ENV_FILE}"
    )

    print(
        f"Database URL:  "
        f"{'найден' if DATABASE_URL else 'НЕ НАЙДЕН'}"
    )

    print()

    print(
        f"Output:        {OUTPUT_DIR}"
    )

    print(
        f"Frames:        {FRAMES_DIR}"
    )

    print(
        f"Media:         {MEDIA_DIR}"
    )

    print(
        f"Logs:          {LOGS_DIR}"
    )

    print()

    print(
        f"OCR minimum:   {OCR_MIN_CONFIDENCE:.0%}"
    )

    print(
        f"Max images:     {MAX_IMAGES}"
    )

    print()

    print("=" * 70)
    print("CONFIG OK")
    print("=" * 70)
    print()
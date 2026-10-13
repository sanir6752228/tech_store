from __future__ import annotations

import json
import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path


# ============================================================
# UTF-8
# ============================================================

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(
        encoding="utf-8",
        errors="replace",
    )

if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(
        encoding="utf-8",
        errors="replace",
    )


# ============================================================
# TECHSTORE TELEGRAM IMPORTER
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

OUTPUT_DIR = BASE_DIR / "output"
HISTORY_DIR = OUTPUT_DIR / "history"

IMPORT_RESULT_FILE = OUTPUT_DIR / "import_result.json"
PIPELINE_RESULT_FILE = OUTPUT_DIR / "pipeline_result.json"


# ============================================================
# PIPELINE
# ============================================================

STEPS = [
    {
        "name": "Обработка видео",
        "script": "video_processor.py",
        "outputs": [
            OUTPUT_DIR / "frames",
        ],
    },
    {
        "name": "OCR — распознавание товара",
        "script": "ocr.py",
        "outputs": [
            OUTPUT_DIR / "ocr_result.json",
            OUTPUT_DIR / "product_draft.json",
        ],
    },
    {
        "name": "Выбор лучших фотографий",
        "script": "image_selector.py",
        "outputs": [
            OUTPUT_DIR / "product_images.json",
        ],
    },
    {
        "name": "Обогащение товара",
        "script": "product_enricher.py",
        "outputs": [
            OUTPUT_DIR / "enriched_product.json",
        ],
    },
    {
        "name": "Проверка качества",
        "script": "validator.py",
        "outputs": [
            OUTPUT_DIR / "validation.json",
        ],
    },
    {
        "name": "Сохранение в ProductDraft",
        "script": "save_draft.py",
        "outputs": [
            IMPORT_RESULT_FILE,
        ],
    },
]


# ============================================================
# UTILS
# ============================================================

def now() -> str:
    return datetime.now().isoformat(
        timespec="seconds"
    )


def print_header(title: str) -> None:
    print()
    print("=" * 70)
    print(title)
    print("=" * 70)


def print_step(
    number: int,
    total: int,
    title: str,
) -> None:
    print()
    print("-" * 70)
    print(
        f"[{number}/{total}] {title}"
    )
    print("-" * 70)


def read_json(
    path: Path,
) -> dict | None:

    if not path.exists():
        return None

    try:
        with path.open(
            "r",
            encoding="utf-8",
        ) as file:

            data = json.load(file)

        if isinstance(data, dict):
            return data

    except Exception as error:

        print()
        print(
            f"⚠ Ошибка чтения {path.name}:"
        )
        print(f"  {error}")

    return None


def backup_previous_import_result() -> None:

    if not IMPORT_RESULT_FILE.exists():
        return

    HISTORY_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    timestamp = datetime.now().strftime(
        "%Y%m%d_%H%M%S"
    )

    destination = (
        HISTORY_DIR
        / f"import_result_{timestamp}.json"
    )

    try:

        shutil.copy2(
            IMPORT_RESULT_FILE,
            destination,
        )

        print()
        print(
            "✓ Старый import_result сохранён:"
        )
        print(f"  {destination}")

    except Exception as error:

        print()
        print(
            "⚠ Не удалось сохранить "
            "предыдущий import_result:"
        )
        print(f"  {error}")


# ============================================================
# SAVE ERROR DRAFT
# ============================================================

def save_error_draft(
    *,
    step_name: str,
    script_name: str,
    error_text: str,
) -> int | None:
    """
    Создаёт ProductDraft со статусом ERROR,
    чтобы ошибка появилась в админке.
    """

    try:

        # psycopg2 импортируем здесь,
        # чтобы основной pipeline мог работать
        # даже если БД временно недоступна.

        import psycopg2  # type: ignore

        from config import DATABASE_URL

        if not DATABASE_URL:
            print()
            print(
                "⚠ DATABASE_URL не найден."
            )

            return None

        connection = psycopg2.connect(
            DATABASE_URL
        )

        try:

            cursor = connection.cursor()

            try:

                timestamp = datetime.now().strftime(
                    "%d.%m.%Y %H:%M:%S"
                )

                name = (
                    f"Ошибка импорта "
                    f"{timestamp}"
                )

                admin_comment = (
                    "Не удалось обработать "
                    "импорт.\n\n"
                    f"Этап: {step_name}\n"
                    f"Файл: {script_name}\n\n"
                    "Причина:\n"
                    f"{error_text}"
                )

                raw_data = {
                    "error": {
                        "step": step_name,
                        "script": script_name,
                        "message": error_text,
                    },
                    "createdAt": now(),
                }

                cursor.execute(
                    """
                    INSERT INTO "ProductDraft" (
                        "name",
                        "brand",
                        "model",
                        "category",
                        "condition",
                        "price",
                        "images",
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
                        NOW(),
                        NOW()
                    )
                    RETURNING "id"
                    """,
                    (
                        name,
                        None,
                        None,
                        "other",
                        "Не определено",
                        None,
                        [],
                        json.dumps(
                            raw_data,
                            ensure_ascii=False,
                        ),
                        "ERROR",
                        admin_comment,
                    ),
                )

                draft_id = cursor.fetchone()[0]

                connection.commit()

                print()
                print(
                    "⚠ Ошибка сохранена "
                    "в ProductDraft:"
                )
                print(
                    f"  Draft ID: {draft_id}"
                )

                return draft_id

            except Exception:

                connection.rollback()

                raise

            finally:

                cursor.close()

        finally:

            connection.close()

    except Exception as error:

        print()
        print(
            "⚠ Не удалось сохранить "
            "ошибку в ProductDraft:"
        )

        print(
            f"  {error}"
        )

        return None


# ============================================================
# RUN SCRIPT
# ============================================================

def run_script(
    script_name: str,
) -> dict:

    script_path = (
        BASE_DIR / script_name
    )

    if not script_path.exists():

        print()
        print(
            "❌ Файл не найден:"
        )
        print(
            f"  {script_path}"
        )

        return {
            "returnCode": 1,
            "stdout": "",
            "stderr": (
                f"Файл не найден: "
                f"{script_path}"
            ),
        }

    command = [
        sys.executable,
        "-X",
        "utf8",
        str(script_path),
    ]

    print(
        f"▶ Запуск: {script_name}"
    )

    print()

    try:

        result = subprocess.run(
            command,
            cwd=BASE_DIR,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            check=False,
        )

    except Exception as error:

        print()
        print(
            f"❌ Ошибка запуска "
            f"{script_name}:"
        )
        print(
            f"  {error}"
        )

        return {
            "returnCode": 1,
            "stdout": "",
            "stderr": str(error),
        }

    stdout = result.stdout or ""
    stderr = result.stderr or ""

    if stdout.strip():

        print(
            "----- STDOUT -----"
        )
        print(
            stdout.rstrip()
        )
        print(
            "------------------"
        )

    if stderr.strip():

        print()

        print(
            "----- STDERR -----"
        )
        print(
            stderr.rstrip()
        )
        print(
            "------------------"
        )

    print()

    if result.returncode != 0:

        print(
            f"❌ {script_name} "
            "завершился с ошибкой."
        )

        print(
            f"Код: {result.returncode}"
        )

    else:

        print(
            f"✓ {script_name} "
            "завершён успешно"
        )

    return {
        "returnCode": result.returncode,
        "stdout": stdout,
        "stderr": stderr,
    }


# ============================================================
# CHECK OUTPUTS
# ============================================================

def check_outputs(
    outputs: list[Path],
) -> bool:

    success = True

    for path in outputs:

        if path.is_dir():

            try:
                files = list(
                    path.iterdir()
                )
            except Exception:
                files = []

            if not files:

                print(
                    "❌ Папка пуста:"
                )
                print(
                    f"  {path}"
                )

                success = False

            else:

                print(
                    f"✓ {path.name}/ "
                    f"({len(files)} объектов)"
                )

        else:

            if not path.exists():

                print(
                    "❌ Файл не найден:"
                )
                print(
                    f"  {path}"
                )

                success = False

            else:

                print(
                    f"✓ {path.name}"
                )

    return success


# ============================================================
# SAVE PIPELINE RESULT
# ============================================================

def save_pipeline_result(
    *,
    status: str,
    started_at: str,
    finished_at: str,
    steps: list[dict],
    import_result: dict | None = None,
    error: str | None = None,
) -> None:

    result = {
        "status": status,
        "startedAt": started_at,
        "finishedAt": finished_at,
        "steps": steps,
        "importResult": import_result,
        "error": error,
    }

    try:

        OUTPUT_DIR.mkdir(
            parents=True,
            exist_ok=True,
        )

        with PIPELINE_RESULT_FILE.open(
            "w",
            encoding="utf-8",
        ) as file:

            json.dump(
                result,
                file,
                ensure_ascii=False,
                indent=2,
            )

    except Exception as save_error:

        print()

        print(
            "⚠ Не удалось сохранить "
            "pipeline_result.json:"
        )

        print(
            f"  {save_error}"
        )


# ============================================================
# MAIN
# ============================================================

def main() -> int:

    started_at = now()

    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    print_header(
        "TECHSTORE TELEGRAM IMPORTER"
    )

    print()

    print(
        f"Importer: {BASE_DIR}"
    )

    print(
        f"Python:   {sys.executable}"
    )

    print(
        f"Старт:    {started_at}"
    )

    backup_previous_import_result()

    step_results = []

    total_steps = len(STEPS)

    for index, step in enumerate(
        STEPS,
        start=1,
    ):

        step_name = step["name"]
        script_name = step["script"]
        expected_outputs = step["outputs"]

        print_step(
            index,
            total_steps,
            step_name,
        )

        step_started = now()

        run_result = run_script(
            script_name
        )

        return_code = (
            run_result["returnCode"]
        )

        stdout = (
            run_result["stdout"]
        )

        stderr = (
            run_result["stderr"]
        )

        step_finished = now()

        # ====================================================
        # SCRIPT ERROR
        # ====================================================

        if return_code != 0:

            error_text = (
                stderr.strip()
                or stdout.strip()
                or (
                    f"{script_name} "
                    f"завершился с кодом "
                    f"{return_code}"
                )
            )

            error_draft_id = (
                save_error_draft(
                    step_name=step_name,
                    script_name=script_name,
                    error_text=error_text,
                )
            )

            step_results.append(
                {
                    "step": index,
                    "name": step_name,
                    "script": script_name,
                    "status": "FAILED",
                    "returnCode": return_code,
                    "outputsValid": False,
                    "startedAt": step_started,
                    "finishedAt": step_finished,
                    "stdout": stdout,
                    "stderr": stderr,
                    "error": error_text,
                    "errorDraftId": error_draft_id,
                }
            )

            finished_at = now()

            save_pipeline_result(
                status="FAILED",
                started_at=started_at,
                finished_at=finished_at,
                steps=step_results,
                error=(
                    f"Ошибка на шаге "
                    f"{index}: "
                    f"{script_name}\n\n"
                    f"{error_text}"
                ),
            )

            print_header(
                "PIPELINE ОСТАНОВЛЕН"
            )

            print()

            print(
                f"❌ Шаг: {step_name}"
            )

            print(
                f"❌ Файл: {script_name}"
            )

            print(
                f"❌ Код: {return_code}"
            )

            if error_draft_id is not None:

                print()

                print(
                    "⚠ Ошибка добавлена "
                    "в админку."
                )

                print(
                    f"Draft ID: "
                    f"{error_draft_id}"
                )

            print()

            print(
                "❌ Реальная ошибка:"
            )

            print(
                error_text
            )

            print()

            print(
                "Pipeline result:"
            )

            print(
                f"  {PIPELINE_RESULT_FILE}"
            )

            return return_code

        # ====================================================
        # OUTPUT VALIDATION
        # ====================================================

        print()

        print(
            "Проверка результатов:"
        )

        outputs_valid = check_outputs(
            expected_outputs
        )

        if not outputs_valid:

            error_text = (
                "Ожидаемый результат "
                "не найден."
            )

            error_draft_id = (
                save_error_draft(
                    step_name=step_name,
                    script_name=script_name,
                    error_text=error_text,
                )
            )

            step_results.append(
                {
                    "step": index,
                    "name": step_name,
                    "script": script_name,
                    "status": "FAILED",
                    "returnCode": 0,
                    "outputsValid": False,
                    "startedAt": step_started,
                    "finishedAt": step_finished,
                    "error": error_text,
                    "errorDraftId": error_draft_id,
                }
            )

            finished_at = now()

            save_pipeline_result(
                status="FAILED",
                started_at=started_at,
                finished_at=finished_at,
                steps=step_results,
                error=(
                    "Ожидаемый результат "
                    "не найден после "
                    f"{script_name}"
                ),
            )

            print_header(
                "PIPELINE ОСТАНОВЛЕН"
            )

            print()

            print(
                "❌ Результат шага "
                "не найден."
            )

            if error_draft_id is not None:

                print()

                print(
                    "⚠ Ошибка добавлена "
                    "в админку."
                )

                print(
                    f"Draft ID: "
                    f"{error_draft_id}"
                )

            print()

            print(
                "Pipeline result:"
            )

            print(
                f"  {PIPELINE_RESULT_FILE}"
            )

            return 1

        # ====================================================
        # SUCCESS
        # ====================================================

        step_results.append(
            {
                "step": index,
                "name": step_name,
                "script": script_name,
                "status": "SUCCESS",
                "returnCode": 0,
                "outputsValid": True,
                "startedAt": step_started,
                "finishedAt": step_finished,
                "stdout": stdout,
                "stderr": stderr,
            }
        )

        print()

        print(
            f"✓ Шаг {index}/{total_steps} "
            "завершён"
        )

    # ========================================================
    # IMPORT RESULT
    # ========================================================

    import_result = read_json(
        IMPORT_RESULT_FILE
    )

    if import_result is None:

        error_text = (
            "import_result.json "
            "отсутствует или "
            "не удалось прочитать."
        )

        error_draft_id = save_error_draft(
            step_name=(
                "Сохранение результата импорта"
            ),
            script_name="save_draft.py",
            error_text=error_text,
        )

        finished_at = now()

        save_pipeline_result(
            status="FAILED",
            started_at=started_at,
            finished_at=finished_at,
            steps=step_results,
            error=error_text,
        )

        print_header(
            "PIPELINE ОШИБКА"
        )

        print()

        print(
            "❌ import_result.json "
            "не найден."
        )

        if error_draft_id is not None:

            print()

            print(
                "⚠ Ошибка добавлена "
                "в админку."
            )

            print(
                f"Draft ID: "
                f"{error_draft_id}"
            )

        print()

        print(
            "Pipeline result:"
        )

        print(
            f"  {PIPELINE_RESULT_FILE}"
        )

        return 1

    # ========================================================
    # STATUS
    # ========================================================

    import_status = str(
        import_result.get(
            "status",
            "",
        )
    ).upper()

    draft_id = import_result.get(
        "draftId"
    )

    method = import_result.get(
        "method"
    )

    fingerprint = import_result.get(
        "fingerprint"
    )

    if import_status in {
        "CREATED",
        "DUPLICATE",
    }:

        pipeline_status = "SUCCESS"
        pipeline_error = None

    else:

        pipeline_status = "FAILED"

        pipeline_error = (
            "Неизвестный статус "
            f"save_draft.py: "
            f"{import_status}"
        )

    # ========================================================
    # SAVE RESULT
    # ========================================================

    finished_at = now()

    save_pipeline_result(
        status=pipeline_status,
        started_at=started_at,
        finished_at=finished_at,
        steps=step_results,
        import_result=import_result,
        error=pipeline_error,
    )

    # ========================================================
    # FINAL
    # ========================================================

    print_header(
        "PIPELINE ЗАВЕРШЁН"
    )

    print()

    print(
        "Все этапы выполнены успешно."
    )

    print()

    print(
        "Результат импорта:"
    )

    print(
        f"  Статус: "
        f"{import_status}"
    )

    if draft_id is not None:

        print(
            f"  Draft ID: "
            f"{draft_id}"
        )

    if method:

        print(
            f"  Метод: "
            f"{method}"
        )

    if fingerprint:

        print(
            f"  Fingerprint: "
            f"{fingerprint}"
        )

    print()

    if import_status == "CREATED":

        print(
            "✅ НОВЫЙ ТОВАР СОЗДАН"
        )

        print()

        print(
            "ProductDraft успешно "
            "создан."
        )

    elif import_status == "DUPLICATE":

        print(
            "⚠ ДУБЛИКАТ"
        )

        print()

        print(
            "Товар уже существует."
        )

        print(
            "Новый импорт помечен "
            "как DUPLICATE."
        )

        print(
            "Публикация запрещена."
        )

    else:

        print(
            "❌ НЕИЗВЕСТНЫЙ РЕЗУЛЬТАТ"
        )

        print()

        print(
            f"Статус: {import_status}"
        )

        print()

        print(
            f"Pipeline result:"
        )

        print(
            f"  {PIPELINE_RESULT_FILE}"
        )

        return 1

    # ========================================================
    # FILES
    # ========================================================

    print()

    print(
        "Файлы результата:"
    )

    print(
        "  Import result:"
    )

    print(
        f"    {IMPORT_RESULT_FILE}"
    )

    print(
        "  Pipeline result:"
    )

    print(
        f"    {PIPELINE_RESULT_FILE}"
    )

    print()

    print("=" * 70)

    print(
        "✅ PIPELINE SUCCESS"
    )

    print("=" * 70)

    print()

    return 0


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":
    sys.exit(
        main()
    )
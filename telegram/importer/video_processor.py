from pathlib import Path
import cv2 # type: ignore


# =========================================================
# PATHS
# =========================================================

BASE_DIR = Path(__file__).resolve().parent

VIDEO_PATH = BASE_DIR / "media" / "story.mp4"
OUTPUT_DIR = BASE_DIR / "output" / "frames"


# =========================================================
# FRAME EXTRACTION
# =========================================================

def extract_frames(
    video_path: Path,
    output_dir: Path,
    every_seconds: float = 0.5,
) -> list[Path]:

    output_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    # -----------------------------------------------------
    # Удаляем старые кадры
    # -----------------------------------------------------

    old_frames = output_dir.glob("*.jpg")

    for old_frame in old_frames:
        old_frame.unlink()

    # -----------------------------------------------------
    # Открываем видео
    # -----------------------------------------------------

    cap = cv2.VideoCapture(
        str(video_path)
    )

    if not cap.isOpened():
        raise RuntimeError(
            f"Не удалось открыть видео: {video_path}"
        )

    fps = cap.get(
        cv2.CAP_PROP_FPS
    )

    frame_count = int(
        cap.get(
            cv2.CAP_PROP_FRAME_COUNT
        )
    )

    if not fps or fps <= 0:
        cap.release()

        raise RuntimeError(
            "Не удалось определить FPS видео."
        )

    duration = frame_count / fps

    print("=" * 70)
    print("TECHSTORE VIDEO PROCESSOR")
    print("=" * 70)
    print()

    print(
        f"Видео: {video_path.name}"
    )

    print(
        f"FPS: {fps:.2f}"
    )

    print(
        f"Кадров: {frame_count}"
    )

    print(
        f"Продолжительность: {duration:.2f} сек."
    )

    print(
        f"Интервал: {every_seconds:.2f} сек."
    )

    print()

    # -----------------------------------------------------
    # Извлечение
    # -----------------------------------------------------

    saved_frames: list[Path] = []

    current_time = 0.0
    frame_number = 0

    while current_time < duration:

        cap.set(
            cv2.CAP_PROP_POS_MSEC,
            current_time * 1000,
        )

        success, frame = cap.read()

        if not success:
            current_time += every_seconds
            continue

        output_path = (
            output_dir
            / f"frame_{frame_number:04d}.jpg"
        )

        saved = cv2.imwrite(
            str(output_path),
            frame,
            [
                cv2.IMWRITE_JPEG_QUALITY,
                92,
            ],
        )

        if not saved:
            print(
                f"⚠ Не удалось сохранить: "
                f"{output_path.name}"
            )

            current_time += every_seconds
            continue

        saved_frames.append(
            output_path
        )

        print(
            f"[{frame_number + 1:03d}] "
            f"{output_path.name} "
            f"— {current_time:.1f} сек."
        )

        frame_number += 1
        current_time += every_seconds

    cap.release()

    print()
    print("-" * 70)
    print(
        f"Извлечено кадров: "
        f"{len(saved_frames)}"
    )
    print(
        f"Папка: {output_dir}"
    )
    print("-" * 70)

    return saved_frames


# =========================================================
# MAIN
# =========================================================

if __name__ == "__main__":

    if not VIDEO_PATH.exists():
        raise FileNotFoundError(
            f"Видео не найдено:\n{VIDEO_PATH}"
        )

    frames = extract_frames(
        video_path=VIDEO_PATH,
        output_dir=OUTPUT_DIR,
        every_seconds=0.5,
    )

    print()
    print("=" * 70)
    print("VIDEO PROCESSING ЗАВЕРШЁН")
    print("=" * 70)
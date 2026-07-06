import os
import cv2


def extract_video_metadata(video_path: str):

    cap = cv2.VideoCapture(video_path)

    fps = int(cap.get(cv2.CAP_PROP_FPS))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    duration = total_frames / fps if fps else 0

    cap.release()

    return {
        "fps": fps,
        "total_frames": total_frames,
        "duration": duration,
        "width": width,
        "height": height,
        "resolution": f"{width} x {height}"
    }


def validate_video(video_path: str):

    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        return {
            "valid": False,
            "message": "Cannot open video."
        }

    fps = cap.get(cv2.CAP_PROP_FPS)

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    duration = total_frames / fps if fps else 0

    cap.release()

    if fps < 20:
        return {
            "valid": False,
            "message": "FPS is too low."
        }

    if width < 640 or height < 480:
        return {
            "valid": False,
            "message": "Video resolution is too low."
        }

    if duration < 2:
        return {
            "valid": False,
            "message": "Video duration is too short."
        }

    return {
        "valid": True,
        "message": "Video passed validation."
    }


def extract_frames(video_path: str, output_folder: str):

    os.makedirs(output_folder, exist_ok=True)

    print("===== FRAME EXTRACTION STARTED =====")
    print("Video Path:", video_path)
    print("Output Folder:", output_folder)

    cap = cv2.VideoCapture(video_path)

    frame_count = 0

    while True:

        success, frame = cap.read()

        if not success:
            break

        frame_path = os.path.join(
            output_folder,
            f"frame_{frame_count}.jpg"
        )

        cv2.imwrite(frame_path, frame)

        frame_count += 1

    cap.release()

    print(f"Frames Extracted: {frame_count}")


def preprocess_frames(input_folder: str, output_folder: str):

    os.makedirs(output_folder, exist_ok=True)

    print("===== PREPROCESSING STARTED =====")

    processed = 0

    for file in os.listdir(input_folder):

        if not file.endswith(".jpg"):
            continue

        image_path = os.path.join(input_folder, file)

        image = cv2.imread(image_path)

        if image is None:
            continue

        # Resize
        image = cv2.resize(image, (640, 480))

        # Brightness + Contrast
        image = cv2.convertScaleAbs(
            image,
            alpha=1.2,
            beta=20
        )

        # Noise Reduction
        image = cv2.GaussianBlur(
            image,
            (5, 5),
            0
        )

        output_path = os.path.join(output_folder, file)

        cv2.imwrite(output_path, image)

        processed += 1

    print(f"Processed Frames: {processed}")
    print("===== PREPROCESSING COMPLETED =====")
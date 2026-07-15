import cv2
import os


class VideoReader:
    def __init__(self, video_path):
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video not found: {video_path}")

        self.video_path = video_path
        self.cap = cv2.VideoCapture(video_path)

        if not self.cap.isOpened():
            raise IOError(f"Cannot open video: {video_path}")

        self.fps = self.cap.get(cv2.CAP_PROP_FPS)
        self.frame_count = int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT))
        self.width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        self.height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    def get_metadata(self):
        return {
            "fps": self.fps,
            "frame_count": self.frame_count,
            "width": self.width,
            "height": self.height
        }

    def frames(self):
        while True:
            ret, frame = self.cap.read()
            if not ret:
                break
            yield frame
        self.cap.release()

    def release(self):
        if self.cap.isOpened():
            self.cap.release()


if __name__ == "__main__":
    reader = VideoReader("Milestone 2/videos/running.mp4")

    print("Metadata:", reader.get_metadata())

    frame_num = 0
    for frame in reader.frames():
        frame_num += 1

    print(f"Total frames read: {frame_num}")
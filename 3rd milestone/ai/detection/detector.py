"""
YOLO Person Detector.
Uses YOLOv11 (fallback to YOLOv8) for person detection.

Model Comparison:
- YOLOv11: Better mAP, faster inference, improved architecture for small objects.
- YOLOv10: Good but lacks some architectural refinements of v11.
- YOLOv8: Solid fallback, widely supported.
"""
from ultralytics import YOLO
import numpy as np
from typing import List, Tuple

class PersonDetector:
    """
    Person detection using YOLO models.
    """
    def __init__(self, model_path: str = "yolo11n.pt"):
        try:
            self.model = YOLO(model_path)
        except Exception as e:
            print(f"Failed to load {model_path}, falling back to yolov8n.pt. Error: {e}")
            self.model = YOLO("yolov8n.pt")
            
    def predict(self, image: np.ndarray, conf_threshold: float = 0.5) -> List[Tuple[int, int, int, int]]:
        """
        Detect persons in the image.
        Returns list of bounding boxes (x1, y1, x2, y2).
        """
        results = self.model(image, classes=[0], conf=conf_threshold, verbose=False)
        
        bboxes = []
        for result in results:
            boxes = result.boxes.xyxy.cpu().numpy()
            for box in boxes:
                bboxes.append((int(box[0]), int(box[1]), int(box[2]), int(box[3])))
                
        return bboxes

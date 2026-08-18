"""
Multi-person tracker using centroid-based tracking (SORT-style).

Associates detections across frames by minimizing distance
between current and previous bounding box centroids.
"""
import numpy as np
from typing import Dict, List, Tuple, Optional
from collections import OrderedDict


class CentroidTracker:
    """
    Simple centroid-based object tracker for multi-person tracking.

    Uses Euclidean distance between bounding box centroids across frames
    to maintain consistent person IDs.
    """

    def __init__(self, max_disappeared: int = 30, max_distance: float = 100.0):
        """
        Args:
            max_disappeared: Max frames before removing a lost track
            max_distance: Max centroid distance for matching
        """
        self.next_object_id = 0
        self.objects: OrderedDict = OrderedDict()
        self.disappeared: OrderedDict = OrderedDict()
        self.max_disappeared = max_disappeared
        self.max_distance = max_distance
        self.bboxes: OrderedDict = OrderedDict()

    def register(self, centroid: np.ndarray, bbox: np.ndarray):
        """Register a new tracked person."""
        self.objects[self.next_object_id] = centroid
        self.bboxes[self.next_object_id] = bbox
        self.disappeared[self.next_object_id] = 0
        self.next_object_id += 1

    def deregister(self, object_id: int):
        """Remove a lost track."""
        del self.objects[object_id]
        del self.disappeared[object_id]
        del self.bboxes[object_id]

    def update(self, detections: List[np.ndarray]) -> Dict[int, np.ndarray]:
        """
        Update tracks with new detections.

        Args:
            detections: List of [x1, y1, x2, y2, confidence] arrays

        Returns:
            Dict mapping track_id → bounding box
        """
        if len(detections) == 0:
            for obj_id in list(self.disappeared.keys()):
                self.disappeared[obj_id] += 1
                if self.disappeared[obj_id] > self.max_disappeared:
                    self.deregister(obj_id)
            return dict(self.bboxes)

        # Compute centroids of new detections
        input_centroids = np.zeros((len(detections), 2))
        input_bboxes = []
        for i, det in enumerate(detections):
            cx = (det[0] + det[2]) / 2
            cy = (det[1] + det[3]) / 2
            input_centroids[i] = [cx, cy]
            input_bboxes.append(det)

        # If no existing tracks, register all
        if len(self.objects) == 0:
            for i in range(len(input_centroids)):
                self.register(input_centroids[i], np.array(input_bboxes[i]))
            return dict(self.bboxes)

        # Match existing tracks to new detections
        object_ids = list(self.objects.keys())
        object_centroids = list(self.objects.values())

        # Compute distance matrix
        from scipy.spatial.distance import cdist
        D = cdist(np.array(object_centroids), input_centroids)

        rows = D.min(axis=1).argsort()
        cols = D.argmin(axis=1)[rows]

        used_rows = set()
        used_cols = set()

        for (row, col) in zip(rows, cols):
            if row in used_rows or col in used_cols:
                continue
            if D[row, col] > self.max_distance:
                continue
            obj_id = object_ids[row]
            self.objects[obj_id] = input_centroids[col]
            self.bboxes[obj_id] = np.array(input_bboxes[col])
            self.disappeared[obj_id] = 0
            used_rows.add(row)
            used_cols.add(col)

        # Handle unmatched existing tracks
        for row in range(len(object_centroids)):
            if row not in used_rows:
                obj_id = object_ids[row]
                self.disappeared[obj_id] += 1
                if self.disappeared[obj_id] > self.max_disappeared:
                    self.deregister(obj_id)

        # Register new detections
        for col in range(len(input_centroids)):
            if col not in used_cols:
                self.register(input_centroids[col], np.array(input_bboxes[col]))

        return dict(self.bboxes)

    def get_active_tracks(self) -> Dict[int, Dict]:
        """Get all active tracks with centroids and bboxes."""
        return {
            obj_id: {
                'centroid': self.objects[obj_id].tolist(),
                'bbox': self.bboxes[obj_id].tolist(),
                'frames_tracked': self.max_disappeared - self.disappeared[obj_id],
            }
            for obj_id in self.objects
        }

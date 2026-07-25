"""
storage.py
-----------
Minimal local-disk file storage for uploaded videos.

Everything lives under STORAGE_ROOT, one subfolder per video (named by its
UUID) containing the original upload and, once processed, the annotated
skeleton-overlay copy. This is intentionally simple and NOT what you'd run
in production -- the original architecture doc specifies Cloud Storage
(S3/Azure Blob) for exactly this, which is the natural next step once this
needs to run anywhere other than one developer's machine (local disk storage
doesn't survive a redeploy on most cloud platforms, and doesn't scale past
one server). Swapping this module out for an S3-backed version later should
not require touching any router code, since routers only call these
functions, never touch paths directly.
"""

import os
import uuid

STORAGE_ROOT = os.getenv("STORAGE_ROOT", os.path.join(os.path.dirname(os.path.dirname(__file__)), "storage", "videos"))


def video_dir(video_id: uuid.UUID) -> str:
    path = os.path.join(STORAGE_ROOT, str(video_id))
    os.makedirs(path, exist_ok=True)
    return path


def original_video_path(video_id: uuid.UUID, filename: str) -> str:
    ext = os.path.splitext(filename)[1] or ".mp4"
    return os.path.join(video_dir(video_id), f"original{ext}")


def annotated_video_path(video_id: uuid.UUID) -> str:
    return os.path.join(video_dir(video_id), "annotated.mp4")

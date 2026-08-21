from fastapi import APIRouter, UploadFile, File
import shutil
import os

router = APIRouter()

@router.post("/upload-video")
async def upload_video(file: UploadFile = File(...)):
    upload_dir = "datasets"

    os.makedirs(upload_dir, exist_ok=True)

    file_path = os.path.join(upload_dir, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    with open("datasets/latest_video.txt", "w") as f:
        f.write(file_path)

    return {
        "message": "Video uploaded successfully",
        "filename": file.filename
    }
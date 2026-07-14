import os
from fastapi import UploadFile, HTTPException, status

ALLOWED_EXTENSIONS = {".mp4", ".avi", ".mov"}
MAX_FILE_SIZE = 500 * 1024 * 1024  # 500MB
STORAGE_DIR = "storage/videos"

def save_video(file: UploadFile, athlete_id: str) -> str:
    # 1. Validate extension
    filename = file.filename
    _, ext = os.path.splitext(filename.lower())
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension: {ext}. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
        
    # 2. Establish directory path
    dir_path = os.path.join(STORAGE_DIR, athlete_id)
    os.makedirs(dir_path, exist_ok=True)
    
    file_path = os.path.join(dir_path, filename)
    
    # 3. Read in chunks to enforce size limit and write to disk
    total_size = 0
    try:
        with open(file_path, "wb") as buffer:
            while chunk := file.file.read(1024 * 1024):  # 1MB chunk
                total_size += len(chunk)
                if total_size > MAX_FILE_SIZE:
                    buffer.close()
                    if os.path.exists(file_path):
                        os.remove(file_path)
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="File size exceeds the 500MB limit"
                    )
                buffer.write(chunk)
    except Exception as e:
        if not isinstance(e, HTTPException):
            if os.path.exists(file_path):
                os.remove(file_path)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to write file to disk: {str(e)}"
            )
        raise e
            
    return file_path

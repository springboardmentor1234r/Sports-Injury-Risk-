import os

def get_file_size(filepath: str) -> int:
    return os.path.getsize(filepath)

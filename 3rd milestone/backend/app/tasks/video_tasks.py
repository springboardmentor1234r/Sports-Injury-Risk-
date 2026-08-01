from app.tasks.celery_app import celery_app

@celery_app.task
def process_video(video_id: int):
    pass

@celery_app.task
def extract_frames(video_id: int):
    pass

@celery_app.task
def compress_video(video_id: int):
    pass

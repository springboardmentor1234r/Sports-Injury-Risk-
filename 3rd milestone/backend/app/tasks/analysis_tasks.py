from app.tasks.celery_app import celery_app

@celery_app.task
def run_ai_pipeline(analysis_id: int):
    pass

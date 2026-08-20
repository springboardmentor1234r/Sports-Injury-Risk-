from app.tasks.celery_app import celery_app

@celery_app.task
def generate_report(report_id: int):
    pass

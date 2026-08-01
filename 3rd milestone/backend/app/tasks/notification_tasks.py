from app.tasks.celery_app import celery_app

@celery_app.task
def send_email(to: str, subject: str, body: str):
    pass

@celery_app.task
def send_push(user_id: int, message: str):
    pass

@celery_app.task
def send_sms(phone: str, message: str):
    pass

import smtplib
import requests
from pymongo.errors import PyMongoError
from src.worker.celery_app import celery_app
from shared.email_utils import (
    send_forgot_password_otp,
    send_signup_otp,
    send_password_changed_success,
    send_welcome_email,
    send_athlete_welcome_email
)
from src.logger import get_logger

logger = get_logger("notification_tasks")

# Explicit list of exceptions to retry on
RETRY_EXCEPTIONS = (smtplib.SMTPException, ConnectionError, TimeoutError, PyMongoError)

@celery_app.task(
    bind=True,
    autoretry_for=RETRY_EXCEPTIONS,
    retry_backoff=True,
    retry_kwargs={'max_retries': 3}
)
def send_otp_forgot_password_task(self, to_email: str, otp: str):
    logger.info(f"Sending forgot password OTP to {to_email}")
    success = send_forgot_password_otp(to_email, otp)
    if not success:
        raise ConnectionError(f"Failed to send forgot password OTP to {to_email}")
    return "Sent"

@celery_app.task(
    bind=True,
    autoretry_for=RETRY_EXCEPTIONS,
    retry_backoff=True,
    retry_kwargs={'max_retries': 3}
)
def send_otp_signup_task(self, to_email: str, otp: str):
    logger.info(f"Sending signup OTP to {to_email}")
    success = send_signup_otp(to_email, otp)
    if not success:
        raise ConnectionError(f"Failed to send signup OTP to {to_email}")
    return "Sent"

@celery_app.task(
    bind=True,
    autoretry_for=RETRY_EXCEPTIONS,
    retry_backoff=True,
    retry_kwargs={'max_retries': 3}
)
def send_password_changed_success_task(self, to_email: str):
    logger.info(f"Sending password changed confirmation to {to_email}")
    success = send_password_changed_success(to_email)
    if not success:
        raise ConnectionError(f"Failed to send password changed confirmation to {to_email}")
    return "Sent"

@celery_app.task(
    bind=True,
    autoretry_for=RETRY_EXCEPTIONS,
    retry_backoff=True,
    retry_kwargs={'max_retries': 3}
)
def send_welcome_email_task(self, to_email: str, full_name: str):
    logger.info(f"Sending welcome email to {to_email}")
    success = send_welcome_email(to_email, full_name)
    if not success:
        raise ConnectionError(f"Failed to send welcome email to {to_email}")
    return "Sent"

@celery_app.task(
    name="src.worker.notification_tasks.trigger_webhook_task",
    bind=True,
    autoretry_for=(requests.exceptions.ConnectionError, requests.exceptions.Timeout),
    retry_backoff=True,
    max_retries=3
)
def trigger_webhook_task(self, webhook_url: str, payload: dict):
    """
    Pushes a JSON payload to an external webhook URL (e.g. Slack/Discord).
    """
    logger.info(f"Triggering webhook for {webhook_url}")
    try:
        import requests
        response = requests.post(webhook_url, json=payload, timeout=5)
        response.raise_for_status()
        return True
    except Exception as e:
        logger.error(f"Webhook failed to {webhook_url}: {e}")
        raise e

@celery_app.task(
    bind=True,
    autoretry_for=RETRY_EXCEPTIONS,
    retry_backoff=True,
    retry_kwargs={'max_retries': 3}
)
def send_athlete_welcome_email_task(self, to_email: str, full_name: str, reset_token: str):
    logger.info(f"Sending athlete welcome email to {to_email}")
    success = send_athlete_welcome_email(to_email, full_name, reset_token)
    if not success:
        raise ConnectionError(f"Failed to send athlete welcome email to {to_email}")
    return "Sent"

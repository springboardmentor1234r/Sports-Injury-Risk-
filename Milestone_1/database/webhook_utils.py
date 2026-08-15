from database.sql_utils import get_webhooks_by_event
from src.worker.notification_tasks import trigger_webhook_task

def dispatch_webhook_event(event_name: str, payload: dict, user_id: int = None):
    """
    Finds all active webhooks subscribed to `event_name`.
    If `user_id` is provided, filters the subscribers to just that user's webhooks.
    Dispatches the payload to them via Celery background tasks.
    """
    try:
        subscribers = get_webhooks_by_event(event_name, user_id)
        for webhook in subscribers:
            # We delay the Celery task so the HTTP request runs in the background
            trigger_webhook_task.delay(webhook["url"], payload)
            print(f"Dispatched {event_name} webhook to {webhook['url']}")
    except Exception as e:
        print(f"Error dispatching webhook event {event_name}: {e}")

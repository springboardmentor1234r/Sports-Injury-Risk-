from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, HttpUrl
from typing import List, Optional
from api.dependencies import get_current_user
from database.sql_utils import create_webhook, get_webhooks_by_user, delete_webhook
from src.worker.notification_tasks import trigger_webhook_task
from urllib.parse import urlparse

router = APIRouter(prefix="/api/webhooks", tags=["Webhooks"])

class WebhookCreate(BaseModel):
    url: HttpUrl
    events: List[str]

class WebhookResponse(BaseModel):
    id: int
    user_id: int
    url: str
    events: List[str]
    is_active: bool

@router.post("/", response_model=WebhookResponse)
def register_webhook(
    webhook: WebhookCreate,
    current_user: dict = Depends(get_current_user)
):
    """Register a new webhook URL for the current user."""
    # Ensure it's a valid URL string
    url_str = str(webhook.url)
    
    # Try to insert into database
    created = create_webhook(int(current_user["user_id"]), url_str, webhook.events)
    if not created:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register webhook"
        )
    return created

@router.get("/", response_model=List[WebhookResponse])
def list_webhooks(current_user: dict = Depends(get_current_user)):
    """List all registered webhooks for the current user."""
    return get_webhooks_by_user(int(current_user["user_id"]))

@router.delete("/{webhook_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_webhook(webhook_id: int, current_user: dict = Depends(get_current_user)):
    """Delete a specific webhook."""
    deleted = delete_webhook(webhook_id, int(current_user["user_id"]))
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Webhook not found or not owned by user"
        )

@router.post("/test")
def test_webhook(
    webhook: WebhookCreate,
    current_user: dict = Depends(get_current_user)
):
    """Ping a webhook URL with a test payload instantly."""
    payload = {
        "event": "test",
        "message": "This is a test webhook from MoveIQ Sports Injury Risk Detection.",
        "user_id": current_user["user_id"]
    }
    # We send this asynchronously via Celery!
    trigger_webhook_task.delay(str(webhook.url), payload)
    return {"detail": "Test webhook dispatched successfully."}

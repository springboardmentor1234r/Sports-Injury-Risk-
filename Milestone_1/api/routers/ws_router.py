import asyncio
import json
import os
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
import redis.asyncio as aioredis
from typing import Dict
from src.logger import get_logger

logger = get_logger("ws_router")

router = APIRouter(prefix="/api/ws", tags=["websockets"])

# A simple connection manager is optional if we rely strictly on Redis Pub/Sub per socket,
# but it's good practice. We can just yield from Redis pubsub directly in the endpoint.

@router.websocket("/progress/{session_id}")
async def websocket_progress(websocket: WebSocket, session_id: str, token: str = Query(None)):
    await websocket.accept()
    if not token:
        await websocket.close(code=1008, reason="Missing token")
        return
        
    from api.auth.jwt_handler import decode_access_token
    payload = decode_access_token(token)
    
    if not payload or "sub" not in payload:
        await websocket.close(code=1008, reason="Invalid token")
        return
    
    from database.redis_utils import get_redis_url
    redis_url = get_redis_url()
    redis = await aioredis.from_url(redis_url)
    pubsub = redis.pubsub()
    
    channel_name = f"session_progress_{session_id}"
    await pubsub.subscribe(channel_name)
    
    try:
        while True:
            # We use a small timeout so we can also check if the client disconnected
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
            if message is not None:
                data = message["data"].decode("utf-8")
                await websocket.send_text(data)
                
                # If analysis is complete or errored, we can optionally close
                parsed = json.loads(data)
                if parsed.get("step") in ["Analysis Complete", "ERROR"]:
                    break
            
            # Brief yield to event loop
            await asyncio.sleep(0.1)
            
    except WebSocketDisconnect:
        print(f"Client disconnected from {channel_name}")
    except Exception as e:
        print(f"WebSocket Error: {e}")
    finally:
        await pubsub.unsubscribe(channel_name)
        await redis.close()
        try:
            await websocket.close()
        except Exception:
            pass

@router.websocket("/notifications")
async def websocket_notifications(websocket: WebSocket, token: str = Query(None)):
    logger.info(f"[WS] New connection attempt with token: {token[:10] if token else None}...")
    await websocket.accept()
    
    if not token:
        logger.warning("[WS] Missing token, closing.")
        await websocket.close(code=1008, reason="Missing token")
        return
        
    from api.auth.jwt_handler import decode_access_token
    payload = decode_access_token(token)
    
    if not payload or "sub" not in payload:
        logger.warning("[WS] Invalid or expired token, closing.")
        await websocket.close(code=1008, reason="Invalid token")
        return
        
    user_id = payload.get("sub")
    logger.info(f"[WS] Authenticated user {user_id}. Connecting to Redis...")
    
    try:
        from database.redis_utils import get_redis_url
        redis_url = get_redis_url()
        redis = await aioredis.from_url(redis_url)
        pubsub = redis.pubsub()
        
        channel_name = f"user_notifications:{user_id}"
        await pubsub.subscribe(channel_name)
        logger.info(f"[WS] Subscribed to {channel_name}")
    except Exception as e:
        logger.error(f"[WS] Failed to connect to Redis: {e}")
        await websocket.close(code=1011, reason="Internal Server Error")
        return
    
    try:
        while True:
            # We use a small timeout so we can also check if the client disconnected
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
            if message is not None:
                data = message["data"].decode("utf-8")
                await websocket.send_text(data)
                
            # Brief yield to event loop
            await asyncio.sleep(0.1)
            
    except WebSocketDisconnect:
        print(f"Client disconnected from {channel_name}")
    except Exception as e:
        print(f"WebSocket Error: {e}")
    finally:
        await pubsub.unsubscribe(channel_name)
        await redis.close()
        try:
            await websocket.close()
        except Exception:
            pass

@router.websocket("/chat")
async def websocket_chat(websocket: WebSocket, token: str = Query(None)):
    """Real-time chat endpoint using Redis Pub/Sub."""
    await websocket.accept()
    if not token:
        await websocket.close(code=1008, reason="Missing token")
        return
        
    from api.auth.jwt_handler import decode_access_token
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        await websocket.close(code=1008, reason="Invalid token")
        return
        
    user_id = int(payload.get("sub"))
    roles = payload.get("roles", [])
    if not roles:
        from database.sql_utils import get_user_roles
        roles = get_user_roles(user_id)
        
    try:
        from database.redis_utils import get_redis_url
        redis_url = get_redis_url()
        redis = await aioredis.from_url(redis_url)
        pubsub = redis.pubsub()
        channel_name = f"chat_channel:{user_id}"
        await pubsub.subscribe(channel_name)
    except Exception as e:
        logger.error(f"[WS Chat] Redis error: {e}")
        await websocket.close(code=1011, reason="Internal Server Error")
        return
        
    async def redis_listener():
        try:
            while True:
                message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                if message is not None:
                    data = message["data"].decode("utf-8")
                    await websocket.send_text(data)
                await asyncio.sleep(0.05)
        except Exception as e:
            logger.error(f"[WS Chat] Redis listener error: {e}")
            
    listener_task = asyncio.create_task(redis_listener())
    
    try:
        while True:
            # Receive message from the client
            data = await websocket.receive_text()
            try:
                msg_data = json.loads(data)
            except json.JSONDecodeError:
                continue
                
            action = msg_data.get("action")
            contact_id = msg_data.get("contact_id")
            
            if not contact_id:
                continue
                
            contact_id = int(contact_id)
            
            # 1. Verify relationship
            from api.routers.chat_router import verify_relationship
            if not verify_relationship(user_id, contact_id, roles):
                await websocket.send_json({"error": "Unauthorized contact", "action": "error"})
                continue
                
            if action == "send_message":
                text = msg_data.get("text", "").strip()
                if not text:
                    continue
                    
                # 2. Save to MongoDB
                from database.mongo_utils import save_chat_message
                # Run synchronous DB call in a thread pool to avoid blocking the event loop
                saved_msg = await asyncio.to_thread(save_chat_message, user_id, contact_id, text)
                
                # 3. Publish to recipient's Redis channel
                out_payload = json.dumps({"action": "new_message", "message": saved_msg})
                await redis.publish(f"chat_channel:{contact_id}", out_payload)
                
                # 4. Send ACK back to sender (Double white tick)
                await websocket.send_json({"action": "message_delivered", "temp_id": msg_data.get("temp_id"), "message": saved_msg})
                
                # 5. Push Notification (Toast)
                from database.mongo_utils import insert_notification
                import uuid
                await asyncio.to_thread(
                    insert_notification,
                    contact_id, 
                    "chat_message", 
                    f"chat_{saved_msg['_id']}", 
                    "New Message", 
                    "You have a new message from your coach." if "coach" in roles else "You have a new message from your athlete.",
                    "/chat"
                )
                
            elif action == "mark_read":
                # Mark messages sent BY contact_id TO user_id as read
                from database.mongo_utils import mark_messages_as_read
                updated_count = await asyncio.to_thread(mark_messages_as_read, contact_id, user_id)
                if updated_count > 0:
                    # Notify the sender that their messages were read (Double blue tick)
                    read_payload = json.dumps({"action": "messages_read", "by_user_id": user_id, "contact_id": contact_id})
                    await redis.publish(f"chat_channel:{contact_id}", read_payload)
                    
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"[WS Chat] WebSocket error: {e}")
    finally:
        listener_task.cancel()
        await pubsub.unsubscribe(channel_name)
        await redis.close()
        try:
            await websocket.close()
        except Exception:
            pass

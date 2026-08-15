import os
import requests
import redis
from dotenv import load_dotenv

load_dotenv()

USE_LOCAL_DB = os.getenv("USE_LOCAL_DB", "false").lower() == "true"

# Local Redis Config
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_DB = int(os.getenv("REDIS_DB", 0))

# Cloud Upstash Config (REST)
UPSTASH_URL = os.getenv("UPSTASH_REDIS_REST_URL")
UPSTASH_TOKEN = os.getenv("UPSTASH_REDIS_REST_TOKEN")

# Real Redis Connection URI (for Celery & WebSockets)
CLOUD_REDIS_URL = os.getenv("REDIS_CELERY_URL", "redis://localhost:6379/0")

def get_redis_url() -> str:
    """Returns the true connection URI for Celery or WebSockets."""
    if USE_LOCAL_DB:
        return f"redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}"
    # redis-py strictly wants 'none', but Celery wants 'CERT_NONE'
    return CLOUD_REDIS_URL.replace("CERT_NONE", "none")

if USE_LOCAL_DB:
    # Local Connection Pool
    pool = redis.ConnectionPool(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB, decode_responses=True)
    def get_redis_client():
        return redis.Redis(connection_pool=pool)
else:
    # Cloud Upstash Client via REST
    class UpstashRedisClient:
        def __init__(self, url: str, token: str):
            self.url = url
            self.headers = {"Authorization": f"Bearer {token}"}

        def setex(self, key: str, expiry: int, value: str):
            res = requests.post(
                self.url,
                json=["SETEX", key, int(expiry), str(value)],
                headers=self.headers
            )
            res.raise_for_status()
            return res.json().get("result")

        def get(self, key: str):
            res = requests.post(
                self.url,
                json=["GET", key],
                headers=self.headers
            )
            res.raise_for_status()
            return res.json().get("result")

        def delete(self, key: str):
            res = requests.post(
                self.url,
                json=["DEL", key],
                headers=self.headers
            )
            res.raise_for_status()
            return res.json().get("result")

    _upstash_client = None
    def get_redis_client():
        global _upstash_client
        if _upstash_client is None:
            _upstash_client = UpstashRedisClient(UPSTASH_URL, UPSTASH_TOKEN)
        return _upstash_client


def store_otp(email: str, otp: str, prefix: str = "signup_otp", expiry_seconds: int = 300) -> bool:
    """Stores the OTP in Redis with a TTL of 5 minutes."""
    try:
        r = get_redis_client()
        key = f"{prefix}:{email}"
        r.setex(key, expiry_seconds, otp)
        return True
    except Exception as e:
        print(f"Failed to store OTP in Redis: {e}")
        return False

def verify_otp(email: str, otp: str, prefix: str = "signup_otp") -> bool:
    """Verifies if the OTP is correct for the given email, and deletes it if so."""
    try:
        r = get_redis_client()
        key = f"{prefix}:{email}"
        stored_otp = r.get(key)
        
        if stored_otp and stored_otp == str(otp):
            r.delete(key)
            return True
        return False
    except Exception as e:
        print(f"Failed to verify OTP in Redis: {e}")
        return False

def publish_notification_event(user_id: int, notification: dict) -> bool:
    """Publishes a new notification payload to the user's Redis channel."""
    try:
        import json
        redis_url = get_redis_url()
        r = redis.Redis.from_url(redis_url)
        channel = f"user_notifications:{user_id}"
        r.publish(channel, json.dumps(notification))
        return True
    except Exception as e:
        print(f"Failed to publish notification to Redis: {e}")
        return False

def get_redis_stats() -> dict:
    """Returns basic monitoring stats from Redis. Handles both local and Upstash gracefully."""
    try:
        r = get_redis_client()
        # Upstash custom client (REST) does not have .info(). Fallback to standard redis-py if needed.
        if hasattr(r, 'info'):
            info = r.info()
            return {
                "status": "ok",
                "memory_used_mb": round(info.get("used_memory", 0) / (1024 * 1024), 2),
                "connected_clients": info.get("connected_clients", 0),
                "keyspace_hits": info.get("keyspace_hits", 0),
                "keyspace_misses": info.get("keyspace_misses", 0)
            }
        else:
            # For Upstash REST client, info is not easily available via REST out-of-the-box without INFO command support.
            # We attempt a raw INFO command via REST.
            res = requests.post(UPSTASH_URL, json=["INFO"], headers=r.headers)
            if res.status_code == 200:
                raw_info = res.json().get("result", "")
                
                # Parse raw Redis INFO string
                stats = {"status": "ok", "memory_used_mb": "N/A", "connected_clients": "N/A"}
                for line in raw_info.splitlines():
                    if ":" in line:
                        k, v = line.split(":", 1)
                        if k == "used_memory":
                            stats["memory_used_mb"] = round(int(v) / (1024 * 1024), 2)
                        elif k == "connected_clients":
                            stats["connected_clients"] = int(v)
                        elif k == "keyspace_hits":
                            stats["keyspace_hits"] = int(v)
                        elif k == "keyspace_misses":
                            stats["keyspace_misses"] = int(v)
                return stats
            return {"status": "ok", "message": "Upstash REST - stats not available"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


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

# Cloud Upstash Config
UPSTASH_URL = os.getenv("UPSTASH_REDIS_REST_URL")
UPSTASH_TOKEN = os.getenv("UPSTASH_REDIS_REST_TOKEN")

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

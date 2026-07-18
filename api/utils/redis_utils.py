import os
import redis
from dotenv import load_dotenv

load_dotenv()

# We assume redis is running locally in docker on the default port
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_DB = int(os.getenv("REDIS_DB", 0))

# Create a connection pool
pool = redis.ConnectionPool(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB, decode_responses=True)

def get_redis_client():
    return redis.Redis(connection_pool=pool)

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

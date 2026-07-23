from dotenv import load_dotenv
import os
from upstash_redis import Redis

load_dotenv()

redis = Redis(
    url=os.getenv("UPSTASH_REDIS_REST_URL"),
    token=os.getenv("UPSTASH_REDIS_REST_TOKEN"),
)

print(redis.ping())

redis.set("name", "Debu")
print(redis.get("name"))
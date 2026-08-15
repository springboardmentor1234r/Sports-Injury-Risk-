import os
from elasticsearch import Elasticsearch
from dotenv import load_dotenv
from src.logger import get_logger

logger = get_logger("elastic_utils")

load_dotenv()

# Global Elasticsearch client
_es_client = None

def get_es_client():
    global _es_client
    if _es_client is not None:
        return _es_client

    use_local = os.getenv("USE_LOCAL_DB", "true").lower() == "true"
    if use_local:
        es_url = os.getenv("LOCAL_ELASTICSEARCH_URL", "http://localhost:9200")
    else:
        es_url = os.getenv("CLOUD_ELASTICSEARCH_URL", "https://elasticsearch-production-c98b.up.railway.app")

    try:
        # We disable verification in development if using self-signed certs,
        # but Railway handles proper TLS.
        _es_client = Elasticsearch([es_url])
        # Verify connection
        if _es_client.ping():
            logger.info(f"Connected to Elasticsearch at {es_url}")
        else:
            logger.warning(f"Could not connect to Elasticsearch at {es_url}")
    except Exception as e:
        logger.error(f"Error initializing Elasticsearch client: {e}")
        _es_client = None

    return _es_client

def initialize_indices():
    """Create necessary indices and mappings if they don't exist."""
    es = get_es_client()
    if not es:
        return

    athlete_mapping = {
        "mappings": {
            "properties": {
                "athlete_id": {"type": "keyword"},
                "coach_id": {"type": "integer"},
                "full_name": {
                    "type": "text",
                    "fields": {
                        "keyword": {"type": "keyword", "ignore_above": 256}
                    }
                },
                "email": {"type": "text"},
                "sport": {"type": "keyword"},
                "has_previous_injury": {"type": "keyword"},
                "previous_injury_type": {"type": "text"},
                "risk_category": {"type": "keyword"},
                "profile_picture_url": {"type": "keyword", "index": False}
            }
        }
    }

    index_name = "athletes"
    try:
        if not es.indices.exists(index=index_name):
            es.indices.create(index=index_name, body=athlete_mapping)
            logger.info(f"Created index: {index_name}")
        else:
            logger.info(f"Index {index_name} already exists.")
    except Exception as e:
        logger.error(f"Failed to create index {index_name}: {e}")

    # Coach index mapping
    coach_mapping = {
        "mappings": {
            "properties": {
                "id": {"type": "integer"},
                "full_name": {"type": "text"},
                "email": {"type": "text"},
                "coach_code": {"type": "text"}
            }
        }
    }
    
    try:
        if not es.indices.exists(index="coaches"):
            es.indices.create(index="coaches", body=coach_mapping)
            logger.info("Created index: coaches")
    except Exception as e:
        logger.error(f"Failed to create index coaches: {e}")

    # Global users index mapping
    users_mapping = {
        "mappings": {
            "properties": {
                "id": {"type": "integer"},
                "full_name": {"type": "text"},
                "email": {"type": "text"},
                "roles": {"type": "keyword"},
                "is_active": {"type": "boolean"},
                "created_at": {"type": "date"}
            }
        }
    }
    
    try:
        if not es.indices.exists(index="users_global"):
            es.indices.create(index="users_global", body=users_mapping)
            logger.info("Created index: users_global")
    except Exception as e:
        logger.error(f"Failed to create index users_global: {e}")

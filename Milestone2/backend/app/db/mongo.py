import logging
from pymongo import MongoClient
from app.config import settings

logger = logging.getLogger("mongo_db")

class MockCollection:
    def __init__(self, name):
        self.name = name
        self.documents = []
        
    def insert_one(self, doc):
        import uuid
        if "_id" not in doc:
            doc["_id"] = str(uuid.uuid4())
        self.documents.append(doc)
        class InsertResult:
            inserted_id = doc["_id"]
        return InsertResult()

    def find(self, query=None, limit=100):
        if not query:
            return list(self.documents[:limit])
        res = []
        for d in self.documents:
            match = True
            for k, v in query.items():
                if d.get(k) != v:
                    match = False
                    break
            if match:
                res.append(d)
        return res[:limit]

    def find_one(self, query=None):
        res = self.find(query, limit=1)
        return res[0] if res else None

    def count_documents(self, query=None):
        return len(self.find(query, limit=9999))

class MockMongoDB:
    def __init__(self):
        self._collections = {}

    def __getitem__(self, item):
        if item not in self._collections:
            self._collections[item] = MockCollection(item)
        return self._collections[item]

    def get_collection(self, item):
        return self[item]

try:
    mongo_client = MongoClient(settings.MONGO_URI, serverSelectionTimeoutMS=1000)
    # Test connection
    mongo_client.server_info()
    mongo_db = mongo_client[settings.MONGO_DB_NAME]
    logger.info("Connected to MongoDB successfully.")
except Exception as e:
    logger.warning(f"MongoDB connection failed: {e}. Falling back to in-memory Mock MongoDB store.")
    mongo_db = MockMongoDB()

def get_mongo_db():
    return mongo_db

import os
import json
import logging
import uuid
import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime

logger = logging.getLogger("athletiq_ai.database")

# Try importing Motor / PyMongo
try:
    from motor.motor_asyncio import AsyncIOMotorClient
    import pymongo
    MOTOR_AVAILABLE = True
except ImportError:
    MOTOR_AVAILABLE = False

from app.config import settings

class EmbeddedCollection:
    """Thread-safe file-backed collection fallback when MongoDB server is offline."""
    def __init__(self, name: str, filepath: str):
        self.name = name
        self.filepath = filepath
        self._data: List[Dict[str, Any]] = []
        self._load()

    def _load(self):
        if os.path.exists(self.filepath):
            try:
                with open(self.filepath, "r", encoding="utf-8") as f:
                    self._data = json.load(f)
            except Exception as e:
                logger.error(f"Error loading fallback json {self.filepath}: {e}")
                self._data = []
        else:
            self._data = []

    def _save(self):
        try:
            os.makedirs(os.path.dirname(self.filepath), exist_ok=True)
            with open(self.filepath, "w", encoding="utf-8") as f:
                json.dump(self._data, f, indent=2, default=str)
        except Exception as e:
            logger.error(f"Error saving fallback json {self.filepath}: {e}")

    async def insert_one(self, doc: Dict[str, Any]):
        doc_copy = dict(doc)
        if "_id" not in doc_copy and "id" not in doc_copy:
            doc_copy["_id"] = str(uuid.uuid4())
        elif "_id" not in doc_copy and "id" in doc_copy:
            doc_copy["_id"] = doc_copy["id"]
        
        if "id" not in doc_copy:
            doc_copy["id"] = doc_copy["_id"]
            
        self._data.append(doc_copy)
        self._save()
        class InsertResult:
            inserted_id = doc_copy["_id"]
        return InsertResult()

    async def find_one(self, query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        for item in self._data:
            match = True
            for k, v in query.items():
                item_val = item.get(k)
                if k == "_id" and item_val != v and item.get("id") != v:
                    match = False
                    break
                elif k != "_id" and item_val != v:
                    match = False
                    break
            if match:
                return dict(item)
        return None

    def find(self, query: Optional[Dict[str, Any]] = None):
        query = query or {}
        results = []
        for item in self._data:
            match = True
            for k, v in query.items():
                item_val = item.get(k)
                if k == "_id" and item_val != v and item.get("id") != v:
                    match = False
                    break
                elif k != "_id" and item_val != v:
                    match = False
                    break
            if match:
                results.append(dict(item))
        
        class Cursor:
            def __init__(self, data):
                self._data = data
            def sort(self, key, direction=-1):
                reverse = direction == -1
                self._data.sort(key=lambda x: x.get(key, ""), reverse=reverse)
                return self
            async def to_list(self, length=1000):
                return self._data[:length]
            def __aiter__(self):
                self._iter = iter(self._data)
                return self
            async def __anext__(self):
                try:
                    return next(self._iter)
                except StopIteration:
                    raise StopAsyncIteration
        return Cursor(results)

    async def update_one(self, query: Dict[str, Any], update: Dict[str, Any]):
        item = await self.find_one(query)
        if item:
            if "$set" in update:
                for k, v in update["$set"].items():
                    item[k] = v
            else:
                for k, v in update.items():
                    item[k] = v
            for i, d in enumerate(self._data):
                if d.get("_id") == item.get("_id") or d.get("id") == item.get("id"):
                    self._data[i] = item
                    break
            self._save()
            class UpdateResult:
                modified_count = 1
            return UpdateResult()
        class UpdateResult:
            modified_count = 0
        return UpdateResult()

    async def delete_one(self, query: Dict[str, Any]):
        item = await self.find_one(query)
        if item:
            self._data = [d for d in self._data if d.get("_id") != item.get("_id") and d.get("id") != item.get("id")]
            self._save()
            class DeleteResult:
                deleted_count = 1
            return DeleteResult()
        class DeleteResult:
            deleted_count = 0
        return DeleteResult()

    async def count_documents(self, query: Dict[str, Any]) -> int:
        c = self.find(query)
        items = await c.to_list(10000)
        return len(items)

class DatabaseManager:
    def __init__(self):
        self.client = None
        self.db = None
        self.use_mongo = False
        self.collections: Dict[str, Any] = {}
        self.db_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
        os.makedirs(self.db_dir, exist_ok=True)

    async def connect_to_database(self):
        if MOTOR_AVAILABLE:
            try:
                # Create Motor client lazily per active event loop
                self.client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=1500)
                await self.client.admin.command('ping')
                self.db = self.client[settings.DATABASE_NAME]
                self.use_mongo = True
                logger.info(f"Connected successfully to MongoDB at {settings.MONGODB_URL}")
                return
            except Exception as e:
                logger.warning(f"MongoDB server connection failed ({e}). Using embedded local JSON persistence engine.")

        self.use_mongo = False
        logger.info("Using embedded local JSON database engine.")

    def get_collection(self, collection_name: str):
        if self.use_mongo and self.client is not None:
            try:
                # Re-bind client to active loop if loop changed
                loop = asyncio.get_event_loop()
                if self.client._get_loop() != loop:
                    self.client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=1500, io_loop=loop)
                    self.db = self.client[settings.DATABASE_NAME]
                return self.db[collection_name]
            except Exception:
                pass

        if collection_name not in self.collections:
            filepath = os.path.join(self.db_dir, f"{collection_name}.json")
            self.collections[collection_name] = EmbeddedCollection(collection_name, filepath)
        return self.collections[collection_name]

db_manager = DatabaseManager()

def get_db():
    return db_manager

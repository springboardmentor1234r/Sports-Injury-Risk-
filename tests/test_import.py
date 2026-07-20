import sys
import os

try:
    from src.recommendations.engine import run_engine
    print("engine imported successfully")
except Exception as e:
    print("engine import failed:", type(e), e)
    
try:
    from database import mongo_utils
    print("mongo_utils imported successfully")
except Exception as e:
    print("mongo_utils import failed:", type(e), e)

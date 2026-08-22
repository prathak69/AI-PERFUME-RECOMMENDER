import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

client = AsyncIOMotorClient(settings.MONGO_URI, tlsCAFile=certifi.where())
database = client.ai_perfume_recommender_db

perfume_collection = database.get_collection("inventory")
recommend_collection = database.get_collection("recommend")


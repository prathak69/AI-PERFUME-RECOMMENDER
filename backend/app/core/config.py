import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME:str="AI PERFUME RECOMMENDER"
    API_V1_STR:str="/api/v1"

    MONGO_URI:str= os.getenv('MONGO_URI', "")
    GEMINI_API_KEY:str= os.getenv('GEMINI_API_KEY', '')
    OPEN_WEATHER_API_KEY:str = os.getenv('OPEN_WEATHER_API_KEY', '')

    CORS_ORIGINS: list[str] = [
        "http://localhost:4200",
        "http://127.0.0.1:4200",
    ]

settings = Settings()
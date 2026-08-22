from datetime import datetime
from fastapi import APIRouter, HTTPException
from app.services.gemini_service import GeminiService
from app.schemas.recommend import RecommendRequest
from app.services.weather_service import WeatherService
from app.core.database import perfume_collection, recommend_collection

router = APIRouter()
gemini = GeminiService()

@router.post("")
async def recommend(request: RecommendRequest):
    cursor = perfume_collection.find({}, {"_id": 0})
    user_perfumes = await cursor.to_list(length=100)

    if not user_perfumes:
        raise HTTPException(status_code=400, detail="Inventory is empty. Add perfumes first")

    weather = WeatherService.get_weather(request.city)
    time_of_day = WeatherService.get_time()

    recommendation_data = gemini.get_recommendation(user_perfumes, request.city, weather, request.occasion, time_of_day)

    history_entry = {
        "city": request.city,
        "occasion": request.occasion,
        "weather": weather,
        "time_of_day": time_of_day,
        "recommendation": recommendation_data,
        "created_at": datetime.utcnow().isoformat()
    }

    await recommend_collection.insert_one(history_entry)

    return {
        "status": "success",
        "weather": weather,
        "time_of_day": time_of_day,
        "recommendation": recommendation_data
    }


    

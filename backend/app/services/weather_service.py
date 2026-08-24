import requests
import json
from datetime import datetime
from fastapi import HTTPException
from app.core.config import settings

class WeatherService:
    @staticmethod
    def get_weather(city:str)->dict:
        url = "http://api.openweathermap.org/data/2.5/weather"
        params = {
            "q": city,
            "appid": settings.OPEN_WEATHER_API_KEY,
            "units": "metric"
        }
        res=requests.get(url, params=params)
        if res.status_code == 200:
            data = res.json()
            return {
                "temp": f"{data['main']['temp']}°C",
                "condition": data["weather"][0]["main"],
                "description": data["weather"][0]["description"],
                "humidity": f"{data['main']['humidity']}%",
                "w_code": str(data["weather"][0]["id"])
            }
        raise HTTPException(status_code=400, detail=f"Could not retrieve weather for {city}")
    
    @staticmethod
    def get_time():
        hour = datetime.now().hour
        if 5<hour<=12:
            return "morning"
        elif 12<hour<=16:
            return "afternoon"
        elif 16<hour<=21:
            return "evening"
        else:
            return "night"
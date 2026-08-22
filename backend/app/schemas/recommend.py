from pydantic import BaseModel
from typing import Dict, Any

class RecommendRequest(BaseModel):
    city: str
    occasion: str

class RecommendationResult(BaseModel):
    recommend_result: str
    reasoning: str

class RecommendationResponse(BaseModel):
    status: str
    weather: Dict[str, Any]
    time_of_day: str
    recommendation: RecommendationResult


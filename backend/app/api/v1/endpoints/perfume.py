from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from app.core.database import perfume_collection 
from app.schemas.perfume import PerfumeCreate
from app.services.gemini_service import GeminiService

router = APIRouter()
gemini = GeminiService()

@router.get("")
async def list_perfume():
    cursor = perfume_collection.find({}, {"_id": 0}).sort("created_at", -1)
    perfumes = await cursor.to_list(length=100)
    return {
        "status": "success",
        "data": perfumes
    }

@router.post("")
async def create_perfume(perfume: PerfumeCreate):
    try:
        profile = gemini.extract_perfume_profile(perfume.name, perfume.brand)
        enriched_perfume = {
            "name": perfume.name,
            "brand": perfume.brand,
            "notes": {
                "top_notes": profile.get("top_notes", []),
                "heart_notes": profile.get("heart_notes", []),
                "base_notes": profile.get("base_notes", [])
            },
            "main_accords": profile.get("main_accords", []),
            "seasonality": profile.get("best_seasons", []),
            "created_at": datetime.now(timezone.utc).isoformat()
        }

        await perfume_collection.insert_one(enriched_perfume)
        enriched_perfume.pop("_id", None)
        return {
            "status":"success",
            "data": enriched_perfume
        }
    
    except HTTPException as e:
        raise HTTPException(status_code=500, detail=str(e))


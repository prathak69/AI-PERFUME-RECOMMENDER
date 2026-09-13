from bson import ObjectId
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from app.core.database import perfume_collection 
from app.schemas.perfume import PerfumeCreate
from app.services.gemini_service import GeminiService

router = APIRouter()
gemini = GeminiService()

@router.get("")
async def list_perfume():
    cursor = perfume_collection.find({}).sort("created_at", -1)
    perfumes = await cursor.to_list(length=100)
    for p in perfumes:
        p["id"] = str(p["_id"])
        p.pop("_id", None)
    return {
        "status": "success",
        "data": perfumes
    }

@router.get("/{perfume_id}")
async def get_perfume_by_id(perfume_id:str):
    if not ObjectId.is_valid(perfume_id):
        raise HTTPException(status_code=400, detail="Invalid bottle ID format.")
    
    doc = await perfume_collection.find_one({"_id": ObjectId(perfume_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Perfume not found.")
    
    doc["id"] = str(doc["_id"])
    doc.pop("_id", None)
    return{
        "status": "success",
        "data": doc
    }

@router.post("")
async def create_perfume(perfume: PerfumeCreate):
    try:
        profile = gemini.extract_perfume_profile(perfume.name, perfume.brand)
        enriched_perfume = {
            "name": perfume.name,
            "brand": perfume.brand,
            "notes": {
                "top": profile.get("top_notes", []),
                "heart": profile.get("heart_notes", []),
                "base": profile.get("base_notes", []),
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

@router.delete("/{perfume_id}")
async def delete_perfume_by_id(perfume_id: str):
    if not ObjectId.is_valid(perfume_id):
        raise HTTPException(status_code=400, detail="Invalid bottle ID format")

    result = await perfume_collection.delete_one({"_id": ObjectId(perfume_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Perfume not found")
    
    
    return {
        "status": "success",
        "data": perfume_id,
        "message": "Perfume deleted successfully"
    }

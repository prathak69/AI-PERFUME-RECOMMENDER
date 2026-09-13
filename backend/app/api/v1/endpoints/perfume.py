from bson import ObjectId
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from app.core.database import perfume_collection 
from app.schemas.perfume import PerfumeCreate
from app.services.gemini_service import GeminiService
from app.services.image_service import ImageService

router = APIRouter()
gemini = GeminiService()

@router.get("")
async def list_perfume():
    cursor = perfume_collection.find({}).sort("created_at", -1)
    perfumes = await cursor.to_list(length=100)
    for p in perfumes:
        if not p.get("image_url"):
            img = ImageService.get_perfume_image(p.get("name", ""), p.get("brand", ""))
            if img:
                await perfume_collection.update_one({"_id": p["_id"]}, {"$set": {"image_url": img}})
                p["image_url"] = img
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
    
    # Backfill image_url for existing bottles if missing
    if not doc.get("image_url"):
        fetched_img = ImageService.get_perfume_image(doc.get("name", ""), doc.get("brand", ""))
        if fetched_img:
            await perfume_collection.update_one({"_id": doc["_id"]}, {"$set": {"image_url": fetched_img}})
            doc["image_url"] = fetched_img

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
        image_url = getattr(perfume, "image_url", None) or ImageService.get_perfume_image(perfume.name, perfume.brand)

        enriched_perfume = {
            "name": perfume.name,
            "brand": perfume.brand,
            "image_url": image_url,
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
        enriched_perfume["id"] = str(enriched_perfume["_id"])
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

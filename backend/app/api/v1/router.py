from fastapi import APIRouter
from app.api.v1.endpoints import perfume, recommend

api_router = APIRouter()


api_router.include_router(perfume.router, prefix="/perfume", tags=["perfume"])
api_router.include_router(recommend.router, prefix="/recommend", tags=["recommend"])
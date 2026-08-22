from pydantic import BaseModel
from typing import Optional, List

class FragranceNotes(BaseModel):
    top: List[str] = []
    heart: List[str] = []
    base: List[str] = []

class PerfumeCreate(BaseModel):
    name: str
    brand: str

class PerfumeResponse(BaseModel):
    name: str
    brand: str
    notes: Optional[FragranceNotes] = None
    main_accords: Optional[List[str]] = []
    seasonality: Optional[List[str]] = []
    created_at: Optional[List[str]] = []



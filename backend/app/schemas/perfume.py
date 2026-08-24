from pydantic import BaseModel
from typing import Optional, List

class FragranceNotes(BaseModel):
    top_notes: List[str] = []
    heart_notes: List[str] = []
    base_notes: List[str] = []

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



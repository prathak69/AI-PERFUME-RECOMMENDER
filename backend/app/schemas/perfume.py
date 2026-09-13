from pydantic import BaseModel
from typing import Optional, List

class FragranceNotes(BaseModel):
    top: Optional[List[str]] = []
    heart: Optional[List[str]] = []
    base: Optional[List[str]] = []
    top_notes: Optional[List[str]] = []
    heart_notes: Optional[List[str]] = []
    base_notes: Optional[List[str]] = []

class PerfumeCreate(BaseModel):
    name: str
    brand: str

class PerfumeResponse(BaseModel):
    name: str
    brand: str
    notes: Optional[FragranceNotes] = None
    main_accords: Optional[List[str]] = []
    seasonality: Optional[List[str]] = []
    created_at: Optional[str] = None



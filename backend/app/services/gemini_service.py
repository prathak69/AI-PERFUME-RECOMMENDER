import json
from google import genai
from google.genai import types
from app.core.config import settings

class GeminiService:
    def __init__(self):
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
    
    def extract_perfume_profile(self, name:str, brand:str) -> dict:
        prompt = f"""
Analyze the fragrance: '{name}' by '{brand}'.
Extract its complete olfactory pyramid and characteristics. List all top, heart, and base notes.

Respond ONLY with a valid JSON object matching this schema:
{{
  "top_notes": ["Note 1", "Note 2"],
  "heart_notes": ["Note 1", "Note 2"],
  "base_notes": ["Note 1", "Note 2"],
  "main_accords": ["Accord 1", "Accord 2"],
  "best_seasons": ["Spring", "Summer", "Fall", "Winter"]
}}
"""

        response = self.client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt,
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )

        return json.loads(response.text)

    def get_recommendation(self, perfumes:list, city:str, weather:dict, occasion:str, time_of_day: str) ->dict:

        prompt = f"""
You are an expert fragrance consultant.

User's Perfume Collection:
{json.dumps(perfumes, indent=2)}

Context:
- City: {city}
- Temperature: {weather['temp']}
- Weather Condition: {weather['condition']} ({weather['description']})
- Humidity: {weather['humidity']}
- Time of Day: {time_of_day}
- Occasion: {occasion}

Task:
Select the SINGLE best perfume from the user's available collection for this weather, time, and occasion.

Respond ONLY with a JSON object matching this exact schema:
{{
  "recommended_perfume": "Perfume Name by Brand",
  "reasoning": "A concise 2-3 sentence explanation of why its scent profile fits this temperature, occasion, and time of day."
}}
"""
        response = self.client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt,
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )

        return json.loads(response.text)

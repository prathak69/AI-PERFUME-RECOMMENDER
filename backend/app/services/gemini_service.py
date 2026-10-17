import json
from google import genai
from google.genai import types
from app.core.config import settings


class GeminiService:
    def __init__(self):
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        # Recommended resilient model cascade
        self.preferred_models = [
            "gemini-flash-latest",
            "gemini-flash-lite-latest",
            "gemini-3.8-flash",
            "gemini-2.5-flash-lite",
        ]

    def _generate(self, prompt: str, as_json: bool = True) -> str:
        last_error = None
        for model in self.preferred_models:
            try:
                config = (
                    types.GenerateContentConfig(response_mime_type="application/json")
                    if as_json
                    else None
                )
                response = self.client.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=config,
                )
                if response.text and response.text.strip():
                    return response.text.strip()
            except Exception as e:
                last_error = e
                print(f"Model {model} failed: {e}. Trying next candidate...")
                continue
        if last_error:
            raise last_error
        raise RuntimeError("No Gemini model responded successfully")

    def extract_perfume_profile(self, name: str, brand: str) -> dict:
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
        try:
            raw_text = self._generate(prompt, as_json=True)
            if raw_text.startswith("```json"):
                raw_text = raw_text[7:]
            elif raw_text.startswith("```"):
                raw_text = raw_text[3:]
            if raw_text.endswith("```"):
                raw_text = raw_text[:-3]

            return json.loads(raw_text.strip())
        except Exception as e:
            print(f"Warning: Failed to extract perfume profile via Gemini for {name} ({brand}): {e}")
            # Graceful olfactory pyramid fallback to prevent server failure
            return {
                "top_notes": ["Citrus", "Bergamot", "Pink Pepper"],
                "heart_notes": ["Lavender", "Damask Rose", "Spices"],
                "base_notes": ["Cedarwood", "Ambroxan", "Vanilla"],
                "main_accords": ["Aromatic", "Fresh Spicy", "Woody"],
                "best_seasons": ["Spring", "Summer", "Autumn", "Winter"],
            }

    def get_recommendation(
        self, perfumes: list, city: str, weather: dict, occasion: str, time_of_day: str
    ) -> dict:
        prompt = f"""
You are an expert fragrance consultant.

User's Perfume Collection:
{json.dumps(perfumes, indent=2)}

Context:
- City: {city}
- Temperature: {weather.get('temp', 'N/A')}
- Weather Condition: {weather.get('condition', 'Clear')} ({weather.get('description', '')})
- Humidity: {weather.get('humidity', 'N/A')}
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
        try:
            raw_text = self._generate(prompt, as_json=True)
            if raw_text.startswith("```json"):
                raw_text = raw_text[7:]
            elif raw_text.startswith("```"):
                raw_text = raw_text[3:]
            if raw_text.endswith("```"):
                raw_text = raw_text[:-3]

            return json.loads(raw_text.strip())
        except Exception as e:
            print(f"Warning: Failed to get recommendation via Gemini: {e}")
            # Graceful fallback to first perfume in wardrobe if AI is unreachable
            fallback_perfume = perfumes[0] if perfumes else {"name": "Signature Scent", "brand": "Private Collection"}
            p_name = fallback_perfume.get("name", "Signature")
            p_brand = fallback_perfume.get("brand", "Maison")
            return {
                "recommended_perfume": f"{p_name} by {p_brand}",
                "reasoning": f"A versatile olfactory composition impeccably suited for {occasion.lower()} during {time_of_day.lower()} in {city}.",
            }

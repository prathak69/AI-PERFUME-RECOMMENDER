import requests
import re
import json
from urllib.parse import quote
from typing import Optional

BLOCKED_DOMAINS = [
    "pinimg.com",
    "pinterest",
    "vecteezy",
    "freepik",
    "shutterstock",
    "gettyimages",
    "dreamstime",
    "alamy",
    "clipart",
    "vector",
    "free-vector",
    "deviantart",
    "facts.net",
    "teacherspayteachers",
    "facebook.com",
    "instagram.com",
    "tiktok.com",
    "youtube.com",
    "wallpapers.com",
    "pngtree.com",
    "bcebos.com",
    "baidu.com",
]

# Verified high-resolution official bottle photography for iconic fragrances
CURATED_BOTTLES: dict[str, str] = {
    "sauvage": "https://fimgs.net/mdimg/secundar/o.34685.jpg",
    "bleu de chanel": "https://fimgs.net/images/secundar/o.54358.jpg",
    "aventus": "https://fimgs.net/images/secundar/o.46401.jpg",
    "baccarat rouge": "https://fimgs.net/himg/o.98217.jpg",
    "black orchid": "https://fimgs.net/photogram/p1200/ub/qn/jZMSznb4AyGMZdkv.jpg",
    "tobacco vanille": "https://fimgs.net/himg/o.4673.jpg",
    "eros": "https://media.ulta.com/i/ulta/2265448?w=800",
    "oud wood": "https://fimgs.net/himg/o.3503.jpg",
    "acqua di gio": "https://fimgs.net/himg/o.90010.jpg",
    "black opium": "https://media.ulta.com/i/ulta/2606620?w=800",
    "le male": "https://fimgs.net/himg/o.qCG2eVaRqKw.jpg",
}

# Neutral, unbranded artistic flacon photography fallbacks (no brand logos)
LUXURY_FLACON_FALLBACKS = [
    "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=1200&q=85",
]

TRUSTED_FRAGRANCE_DOMAINS = [
    "fragrantica",
    "fimgs.net",
    "fraguru.com",
    "sephora",
    "ulta",
    "nordstrom",
    "parfumo",
    "basenotes",
    "perfumania",
    "macys",
    "harrods",
    "boutique",
    "cdn/shop",
    "media-amazon",
    "walmartimages",
    "demandware.static",
    "product",
    "perfume",
    "cologne",
    "hermes",
    "chanel",
    "dior",
]


class ImageService:
    @staticmethod
    def is_invalid_or_fallback_image(image_url: Optional[str], perfume_name: str = "") -> bool:
        """Checks if an existing image URL is empty, a blocked domain, or an incorrect fallback."""
        if not image_url or not isinstance(image_url, str):
            return True
        lower = image_url.lower()
        if any(b in lower for b in BLOCKED_DOMAINS):
            return True
        # Invalidate the old hardcoded Coco Noir Unsplash image unless it actually IS Coco Noir
        if "1592945403244" in image_url and "coco" not in perfume_name.lower():
            return True
        if any(fallback in image_url for fallback in LUXURY_FLACON_FALLBACKS):
            return True
        return False

    @staticmethod
    def get_perfume_image(name: str, brand: str) -> str:
        """
        Search for an authentic, high-resolution product image of the perfume bottle.
        1. Checks curated high-resolution bottle database.
        2. Queries targeted Bing image search with structural parsing & relevance scoring.
        3. Deterministically falls back to an elegant luxury flacon photograph.
        """
        combined = f"{name} {brand}".lower()
        for key, url in CURATED_BOTTLES.items():
            if key in combined:
                return url

        # Targeted Bing image search
        try:
            query = f"{brand} {name} fragrance bottle"
            url = f"https://www.bing.com/images/search?q={quote(query)}&form=HDRSC2&first=1"
            headers = {
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/120.0.0.0 Safari/537.36"
                ),
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
            }
            res = requests.get(url, headers=headers, timeout=6)
            items = re.findall(r'class="iusc"[^>]+m="([^"]+)"', res.text)
            if not items:
                items = re.findall(r"class=\"iusc\"[^>]+m='([^']+)'", res.text)

            clean_name = name.lower().strip()
            name_words = [w for w in clean_name.split() if len(w) > 2]
            clean_brand = brand.lower().strip()

            candidates: list[tuple[int, str]] = []

            for it in items:
                try:
                    data = json.loads(it.replace("&quot;", '"'))
                    murl = data.get("murl", "")
                    desc = data.get("desc", "").lower()
                    purl = data.get("purl", "").lower()

                    if not murl or any(b in murl.lower() or b in purl for b in BLOCKED_DOMAINS):
                        continue

                    # Must match at least one descriptive perfume word or brand
                    if name_words and not any(w in desc or w in purl for w in name_words):
                        if clean_brand not in desc and clean_brand not in purl:
                            continue

                    score = 0
                    if any(t in purl or t in murl.lower() for t in TRUSTED_FRAGRANCE_DOMAINS):
                        score += 15
                    if "fragrantica" in purl or "sephora" in purl or "ulta" in purl or "fimgs.net" in murl:
                        score += 25
                    if clean_brand in desc or clean_brand in purl:
                        score += 10
                    if all(w in desc for w in name_words):
                        score += 12

                    # Normalize URL
                    if murl.startswith("http://"):
                        murl = "https://" + murl[7:]
                    murl = murl.replace("&amp;", "&")

                    candidates.append((score, murl))
                except Exception:
                    continue

            candidates.sort(key=lambda x: x[0], reverse=True)
            if candidates:
                return candidates[0][1]

        except Exception as e:
            print(f"Failed to fetch perfume image for {name} by {brand}: {e}")

        # Graceful luxury flacon fallback
        idx = (len(name) * 3 + len(brand) * 7) % len(LUXURY_FLACON_FALLBACKS)
        return LUXURY_FLACON_FALLBACKS[idx]

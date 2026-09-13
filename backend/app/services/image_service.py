import requests
import re
from urllib.parse import quote
from typing import Optional

class ImageService:
    @staticmethod
    def get_perfume_image(name: str, brand: str) -> Optional[str]:
        """
        Search for an authentic, high-resolution product image of the perfume bottle.
        """
        query = f"{brand} {name} perfume bottle official product"
        url = f"https://www.bing.com/images/search?q={quote(query)}&form=HDRSC2&first=1"
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/122.0.0.0 Safari/537.36"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
        }

        try:
            res = requests.get(url, headers=headers, timeout=6)
            if res.status_code == 200:
                # Extract media URLs from Bing image search results
                murls = re.findall(r'murl&quot;:&quot;(https?://[^&]+)&quot;', res.text)
                for img_url in murls:
                    # Filter for standard image formats
                    lower_url = img_url.lower()
                    if any(ext in lower_url for ext in [".jpg", ".jpeg", ".png", ".webp"]):
                        return img_url

                if murls:
                    return murls[0]
        except Exception as e:
            print(f"Failed to fetch perfume image for {name} by {brand}: {e}")

        return None

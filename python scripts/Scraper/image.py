from pathlib import Path
import hashlib
import httpx
import aiofiles
import asyncio
from lxml import html


async def image_download() -> str | None:
    """Download the main infobox image from the given wiki page."""
    url = "https://awakening.wiki/Way_of_the_Wanderer"

    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.get(url)
        resp.raise_for_status()

        tree = html.fromstring(resp.text)
        image_elem = tree.xpath(
            '//td[contains(@class,"infobox-image")]//img[contains(@class,"mw-file-element")]'
        )
        if not image_elem:
            print("No image found.")
            return None

        image_url = image_elem[0].get("src")
        if not image_url:
            print("Image element found, but no src.")
            return None

        if image_url.startswith("//"):
            image_url = "https:" + image_url
        # image_url = (
        #     "https://gtcdn.info/dune/1.2.10.0/images/map-icons/enemylaboroutpostx2.webp"
        # )

        images_dir = Path("output/images")
        images_dir.mkdir(parents=True, exist_ok=True)

        fname = hashlib.sha256(image_url.encode("utf-8")).hexdigest() + ".png"
        image_path = images_dir / fname
        print(f"Downloading image: {image_url} -> {image_path}")

        if not image_path.exists():
            img_resp = await client.get(image_url)
            img_resp.raise_for_status()
            async with aiofiles.open(image_path, "wb") as f:
                await f.write(img_resp.content)

        return str(image_path)


if __name__ == "__main__":
    image_path = asyncio.run(image_download())
    if image_path:
        print(
            f"Saved image to: Dune-Awakening-Unique-Checklist\\\\Python Scraper\\\\{image_path.replace('\\', '\\\\')}"
        )

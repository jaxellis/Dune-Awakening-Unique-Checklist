from __future__ import annotations

import asyncio
import hashlib
import subprocess
from pathlib import Path
from typing import Optional

import aiofiles
import httpx
from lxml import html
from lxml.html import HtmlElement


async def image_download() -> Optional[str]:
    """
    Download the main infobox image from the given wiki page.
    Returns the local image path if successful, otherwise None.
    """
    url: str = ""  # Wiki page URL
    image_url: str = ""  # Optional direct image URL

    async with httpx.AsyncClient(timeout=httpx.Timeout(20.0)) as client:
        if not image_url:
            if not url:
                print("No URL provided.")
                return None

            resp: httpx.Response = await client.get(url)
            resp.raise_for_status()

            tree: HtmlElement = html.fromstring(resp.text)
            image_elem: list[HtmlElement] = tree.xpath(
                '//td[contains(@class,"infobox-image")]//img[contains(@class,"mw-file-element")]'
            )

            if not image_elem:
                print("No image found.")
                return None

            image_url = image_elem[0].get("src") or ""
            if not image_url:
                print("Image element found, but no src.")
                return None

            if image_url.startswith("//"):
                image_url = "https:" + image_url

        images_dir: Path = Path("../images")
        images_dir.mkdir(parents=True, exist_ok=True)

        fname: str = hashlib.sha256(image_url.encode("utf-8")).hexdigest() + ".png"
        image_path: Path = images_dir / fname

        print(f"Downloading image: {image_url} \n-> {image_path}")

        # Copy the filename to clipboard (Windows)
        subprocess.run(["clip"], input=fname, text=True, check=False)

        if not image_path.exists():
            img_resp: httpx.Response = await client.get(image_url)
            img_resp.raise_for_status()
            async with aiofiles.open(image_path, "wb") as f:
                await f.write(img_resp.content)

        return str(image_path)


if __name__ == "__main__":
    image_path: Optional[str] = asyncio.run(image_download())
    if image_path:
        print(f"Saved image to: {image_path}")

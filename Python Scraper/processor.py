from pathlib import Path
import logging
import asyncio
import json
import httpx
from fetcher import fetch
from detectors import categorize_types, find_category, find_location
from models import Item
from config_loader import CONFIG
import aiofiles
from pathlib import Path

logger = logging.getLogger("scraper")


async def process_item(client: httpx.AsyncClient, url: str) -> dict:
    try:
        page_tree = await fetch(client, url)
        types = categorize_types(page_tree)
        category = find_category(page_tree)
        location = find_location(page_tree)

        name_elem = page_tree.xpath('//span[@class="mw-page-title-main"]/text()')
        name: str = name_elem[0] if name_elem else url.split("/")[-1]

        image_elem = page_tree.xpath(
            '//td[contains(@class,"infobox-image")]//img[contains(@class,"mw-file-element")]'
        )
        if image_elem:
            image_url = image_elem[0].get("src")
            if image_url:
                if image_url.startswith("//"):
                    image_url = "https:" + image_url

                images_dir = Path("output/images")
                images_dir.mkdir(parents=True, exist_ok=True)

                import hashlib

                fname = hashlib.sha256(image_url.encode("utf-8")).hexdigest() + ".png"
                image_path = images_dir / fname

                if not image_path.exists():
                    resp = await client.get(image_url)
                    resp.raise_for_status()
                    async with aiofiles.open(image_path, "wb") as f:
                        await f.write(resp.content)

                image = str(image_path)
            else:
                image = ""
        else:
            image = ""

        item = Item(
            name=name,
            types=types,
            location=location,
            tier="",
            category=category,
            url=url,
            image="Python Scraper\\" + image,
        )

        logger.debug(
            f"Processed item: {item.name} | Category: {item.category} | Types: {item.types} | Image: {item.image}"
        )
        return item.__dict__

    except Exception as e:
        logger.error(f"Error processing {url}: {type(e).__name__}: {e}")
        return {
            "name": url.split("/")[-1],
            "types": ["Unknown"],
            "location": "",
            "tier": "",
            "category": "Unknown",
            "url": url,
            "image": "",
        }


async def process_main():
    """
    Main scraper function.
    Fetches all unique items, processes them concurrently,
    preserves category order from CONFIG['categories'], and includes empty categories.
    """
    sem = asyncio.Semaphore(CONFIG.get("concurrency_limit", 5))

    async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
        logger.info("Fetching item URLs from the Unique items page...")

        try:
            unique_page = await fetch(
                client, f"{CONFIG['base_url'].rstrip('/')}/Unique"
            )
            link_elements = unique_page.xpath(
                '//div[@class="CategoryTreeSection"]//a[@href]'
            )
            urls = [
                CONFIG["base_url"].rstrip("/") + a.get("href") for a in link_elements
            ]

        except Exception as e:
            logger.error(f"Failed to fetch Unique items page: {type(e).__name__}: {e}")
            return

        if CONFIG.get("test_mode"):
            limit = CONFIG.get("test_amount", 20)
            logger.info(f"TEST MODE: Limiting to {limit} items.")
            urls = urls[:limit]

        async def sem_task(url: str):
            async with sem:
                return await process_item(client, url)

        tasks = [asyncio.create_task(sem_task(u)) for u in urls]

        results_by_category: dict[str, list[dict]] = {
            cat: [] for cat in CONFIG.get("categories", [])
        }

        for task in asyncio.as_completed(tasks):
            item_dict = await task
            cat = item_dict.get("category", "Unknown")

            if cat not in results_by_category:
                results_by_category["Unknown"] = []
            results_by_category.setdefault(cat, []).append(item_dict)

        if "Unknown" in results_by_category and not results_by_category["Unknown"]:
            del results_by_category["Unknown"]

    output_dir = Path("output")
    output_dir.mkdir(exist_ok=True)
    out_file = output_dir / CONFIG.get("output_file", "unique_items.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(results_by_category, f, ensure_ascii=False, indent=4)

    logger.info(f"✅ Saved {len(urls)} items to {out_file}")

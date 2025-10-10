import asyncio
import httpx
import logging
from lxml import html
from pathlib import Path
import time
from utils import cache_file_path, is_cache_valid
from config_loader import CONFIG

logger = logging.getLogger(__name__)


async def fetch(client: httpx.AsyncClient, url: str) -> html.HtmlElement:
    """Fetch a URL with retries, caching, and return an lxml HTML tree using global CONFIG."""
    cache_dir = Path(CONFIG.get("cache_dir", ".cache"))
    cache_dir.mkdir(exist_ok=True)
    cache_expiry = CONFIG.get("cache_expiry", 24 * 3600)
    retry_limit = CONFIG.get("retry_limit", 3)
    backoff_factor = CONFIG.get("backoff_factor", 1.5)
    use_cache = CONFIG.get("use_cache", True)

    cache_file = cache_file_path(url, cache_dir)

    if use_cache and is_cache_valid(cache_file, cache_expiry):
        logger.debug(f"Using cached file for {url}")
        with open(cache_file, "r", encoding="utf-8") as f:
            content = f.read()
        return html.fromstring(content)

    for attempt in range(1, retry_limit + 1):
        try:
            logger.debug(f"Fetching URL ({attempt}/{retry_limit}): {url}")
            resp = await client.get(url)
            resp.raise_for_status()
            tree = html.fromstring(resp.text)

            if use_cache:
                with open(cache_file, "w", encoding="utf-8") as f:
                    f.write(resp.text)

            return tree
        except (httpx.RequestError, httpx.HTTPStatusError) as e:
            logger.warning(
                f"Attempt {attempt} failed for {url}: {type(e).__name__}: {e}"
            )
            if attempt < retry_limit:
                sleep_time = backoff_factor**attempt
                logger.info(f"Retrying in {sleep_time:.1f}s...")
                await asyncio.sleep(sleep_time)
            else:
                logger.error(f"Failed to fetch {url} after {retry_limit} attempts")
                raise

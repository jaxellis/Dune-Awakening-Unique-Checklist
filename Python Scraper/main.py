import asyncio
import logging
from pathlib import Path
from processor import process_main
from config_loader import load_config, CONFIG
from detectors import CATEGORIES, LOCATIONS


load_config()


CATEGORIES[:] = CONFIG.get("categories", [])
LOCATIONS[:] = CONFIG.get("locations", [])


log_dir = Path("logs")
log_dir.mkdir(exist_ok=True)
log_level = logging.DEBUG if CONFIG.get("verbose", False) else logging.INFO
logging.basicConfig(
    level=log_level,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(log_dir / "scraper.log", mode="w", encoding="utf-8"),
    ],
)
logger = logging.getLogger(__name__)


if __name__ == "__main__":
    asyncio.run(process_main())

from pathlib import Path
import json

CONFIG = {}


def load_config():
    global CONFIG
    config_dir = Path(__file__).parent / "config"

    with open(config_dir / "scraper_config.json", encoding="utf-8") as f:
        CONFIG.update(json.load(f))

    with open(config_dir / "categories.json", encoding="utf-8") as f:
        CONFIG["categories"] = json.load(f)

    with open(config_dir / "locations.json", encoding="utf-8") as f:
        CONFIG["locations"] = json.load(f)

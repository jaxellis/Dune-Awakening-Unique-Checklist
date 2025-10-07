import unicodedata
import string
import hashlib
import time
from pathlib import Path


def normalize_text(text: str) -> str:
    """Normalize string: remove accents, non-printable characters, and excess whitespace."""
    text = text or ""
    text = unicodedata.normalize("NFKD", text)
    text = "".join(c for c in text if c in string.printable)
    text = " ".join(text.split())
    return text.lower()


def safe_strip(text: str | None) -> str:
    return normalize_text(text or "")


def keyword_in_text(text: str, keywords: list[str]) -> bool:
    text = normalize_text(text)
    return any(normalize_text(k) in text for k in keywords)


def cache_file_path(url: str, cache_dir: str) -> Path:
    h = hashlib.sha256(url.encode("utf-8")).hexdigest()
    return Path(cache_dir) / f"{h}.html"


def is_cache_valid(path: Path, expiry: float) -> bool:
    return path.exists() and (time.time() - path.stat().st_mtime) < expiry

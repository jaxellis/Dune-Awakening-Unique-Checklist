import hashlib
from pathlib import Path
import re

# Paths
SCRIPTS_PATH = Path("../scripts")
STYLES_PATH = Path("../styles")
HTML_FILE = Path("../index.html")


def hash_and_rename_files(path: Path, extension: str) -> dict:
    """
    Hash all files in a directory and rename them.
    Returns a mapping of old names to new names.
    """
    mapping = {}
    for file in path.glob(f"*.{extension}"):
        new_name: str = (
            file.name.split(".")[0].split("_")[0]
            + "_"
            + hashlib.sha256(file.read_bytes()).hexdigest()
            + f".{extension}"
        )
        new_path: Path = file.parent / new_name
        if file.name == new_name:
            print(f"Skipping {file.name} - already hashed")
            continue
        print(f"Renaming {file.name} -> {new_name}")
        file.rename(new_path)
        mapping[file.name] = new_name
    return mapping


def update_html(html_path: Path, js_map: dict, css_map: dict) -> None:
    """
    Updates the script and link tags in the HTML file with hashed names.
    """
    html_content = html_path.read_text(encoding="utf-8")

    # Update JS files
    for old, new in js_map.items():
        html_content = re.sub(
            rf'(<script\s+[^>]*src=["\'].*?{re.escape(old)}["\'])',
            lambda m: m.group(1).replace(old, new),
            html_content,
        )

    # Update CSS files
    for old, new in css_map.items():
        html_content = re.sub(
            rf'(<link\s+[^>]*href=["\'].*?{re.escape(old)}["\'])',
            lambda m: m.group(1).replace(old, new),
            html_content,
        )

    html_path.write_text(html_content, encoding="utf-8")
    print(f"Updated HTML: {html_path}")


def main() -> None:
    js_map = hash_and_rename_files(SCRIPTS_PATH, "js")
    css_map = hash_and_rename_files(STYLES_PATH, "css")
    update_html(HTML_FILE, js_map, css_map)


if __name__ == "__main__":
    main()

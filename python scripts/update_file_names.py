import hashlib
from pathlib import Path
import re
import argparse

# Paths
SCRIPTS_PATH = Path("../scripts")
STYLES_PATH = Path("../styles")
HTML_FILE = Path("../index.html")


def hash_and_rename_files(path: Path, extension: str, dry_run: bool) -> dict[str, str]:
    """
    Hash all files in a directory and rename them.
    Returns a mapping of old names to new names.
    """
    mapping = {}
    for file in path.glob(f"*.{extension}"):
        new_name: str = (
            file.stem.split("_")[0]
            + "_"
            + hashlib.sha256(file.read_bytes()).hexdigest()[:16]
            + f".{extension}"
        )
        new_path = file.parent / new_name
        if file.name == new_name:
            print(f"Skipping {file.name} - already hashed")
            continue

        mapping[file.name] = new_name
        if dry_run:
            print(f"[DRY RUN] Would rename {file.name} -> {new_name}")
        else:
            print(f"Renaming {file.name} -> {new_name}")
            file.rename(new_path)

    return mapping


def update_html(
    html_path: Path, js_map: dict[str, str], css_map: dict[str, str], dry_run: bool
) -> None:
    """
    Updates <script> and <link> tags in the HTML file with hashed names.
    """
    html_content = html_path.read_text(encoding="utf-8")
    updated_content = html_content

    # Update JS references
    for old, new in js_map.items():
        updated_content = re.sub(
            rf'(<script\s+[^>]*src=["\'].*?){re.escape(old)}(["\'])',
            rf"\1{new}\2",
            updated_content,
        )

    # Update CSS references
    for old, new in css_map.items():
        updated_content = re.sub(
            rf'(<link\s+[^>]*href=["\'].*?){re.escape(old)}(["\'])',
            rf"\1{new}\2",
            updated_content,
        )

    if updated_content != html_content:
        print(f"\n✅ HTML changes detected in {html_path.name}:")
        for old, new in {**js_map, **css_map}.items():
            if old in html_content:
                print(f"  - {old} → {new}")

        if dry_run:
            print("[DRY RUN] Would update HTML file")
        else:
            html_path.write_text(updated_content, encoding="utf-8")
            print(f"Updated HTML: {html_path}")
    else:
        print("No changes detected in HTML.")


def update_js_imports(
    scripts_path: Path, js_map: dict[str, str], dry_run: bool
) -> None:
    """
    Updates ES module import paths within JS files to reflect renamed hashed files.
    """
    for js_file in scripts_path.glob("*.js"):
        content = js_file.read_text(encoding="utf-8")
        updated = content

        for old, new in js_map.items():
            updated = re.sub(
                rf'(import\s+(?:[^"\']+\s+from\s+)?["\']\.\/){re.escape(old)}(["\'])',
                rf"\1{new}\2",
                updated,
            )
            updated = re.sub(
                rf'(\bimport\s*\(\s*["\']\.\/){re.escape(old)}(["\']\s*\))',
                rf"\1{new}\2",
                updated,
            )

        if updated != content:
            print(f"\n✅ Import changes in {js_file.name}:")
            for old, new in js_map.items():
                if old in content:
                    print(f"  - {old} → {new}")
            if dry_run:
                print("[DRY RUN] Would update this file")
            else:
                js_file.write_text(updated, encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Hash and update JS/CSS filenames with HTML and import updates."
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Simulate changes without modifying files.",
    )
    args = parser.parse_args()

    dry_run = args.dry_run

    print("🔍 Starting file hash + update process")
    if dry_run:
        print("⚠️  DRY RUN MODE ENABLED — no files will be renamed or written.\n")

    js_map = hash_and_rename_files(SCRIPTS_PATH, "js", dry_run)
    css_map = hash_and_rename_files(STYLES_PATH, "css", dry_run)

    update_html(HTML_FILE, js_map, css_map, dry_run)
    update_js_imports(SCRIPTS_PATH, js_map, dry_run)

    print("\n✨ Done.")
    if dry_run:
        print("No actual changes made (dry run mode).")


if __name__ == "__main__":
    main()

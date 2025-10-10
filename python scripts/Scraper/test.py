from pathlib import Path
import json

output_dir = Path("../output")
output_dir.mkdir(exist_ok=True)
out_file = output_dir / "test.json"
with open(out_file, "w", encoding="utf-8") as f:
    json.dump("{}", f, ensure_ascii=False, indent=4)

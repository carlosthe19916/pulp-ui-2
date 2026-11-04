"""Downloads a model through Pulp with huggingface_hub; HF_ENDPOINT points it at Pulp."""

import json
import os
from pathlib import Path

from huggingface_hub import snapshot_download

print(f"HF_ENDPOINT={os.environ['HF_ENDPOINT']}")
path = Path(snapshot_download("hf-internal-testing/tiny-random-bert", allow_patterns=["*.json"]))
for file in sorted(path.iterdir()):
    print(f"  {file.name}")
config = json.loads((path / "config.json").read_text())
print(f"model_type={config['model_type']} hidden_size={config['hidden_size']}")

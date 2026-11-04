#!/usr/bin/env bash
# Runs the client side of the Hugging Face tutorial against Pulp: download a model with the
# hf CLI and with huggingface_hub, both through the Pulp cache. Run ./setup.sh first.
# Requires Python 3.9 or later.
set -euo pipefail

cd "$(dirname "$0")"
source ../_lib/pulp.sh

export HF_ENDPOINT="${CONTENT_URL}/hf-proxy"
MODEL=hf-internal-testing/tiny-random-bert

# A throwaway virtual environment and Hugging Face cache, so every file really comes from Pulp.
WORK="$PWD/.hf-demo"
rm -rf "$WORK" && python3 -m venv "$WORK/venv"
export HF_HOME="$WORK/hf" HF_HUB_DISABLE_TELEMETRY=1 HF_HUB_DISABLE_PROGRESS_BARS=1
"$WORK/venv/bin/pip" install -q --disable-pip-version-check -r requirements.txt
export PATH="$WORK/venv/bin:$PATH"

step "Download ${MODEL}'s config through ${HF_ENDPOINT}"
hf download "$MODEL" config.json

step "Load it from Python with huggingface_hub"
python load_model.py

step "Done. Open Pulp UI: Content Management > Distributions > hf-proxy"

#!/usr/bin/env bash
# Creates the Pulp objects of the Hugging Face tutorial through the REST API (the same objects the
# tutorial creates in Pulp UI). Safe to re-run: existing objects are kept.
set -euo pipefail

cd "$(dirname "$0")"
source ../_lib/pulp.sh

HF_URL="${HF_URL:-https://huggingface.co}"
# Optional: a Hugging Face token for private or gated models.
HF_TOKEN="${HF_TOKEN-}"

# Proxy the Hugging Face Hub: remote + distribution that pulls through.
remote="$(ensure remotes/hugging_face/hugging-face hf-proxy "$(jq -n \
  --arg url "$HF_URL" --arg token "$HF_TOKEN" \
  '{name: "hf-proxy", url: $url, policy: "on_demand"} + (if $token == "" then {} else {hf_token: $token} end)')")"
ensure distributions/hugging_face/hugging-face hf-proxy \
  "{\"name\":\"hf-proxy\",\"base_path\":\"hf-proxy\",\"remote\":\"${remote}\"}" >/dev/null

show_distributions distributions/hugging_face/hugging-face hf-

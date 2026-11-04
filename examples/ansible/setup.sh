#!/usr/bin/env bash
# Creates the Pulp objects of the Ansible tutorial through the REST API (the same objects the
# tutorial creates in Pulp UI). Safe to re-run: existing objects are kept.
set -euo pipefail

cd "$(dirname "$0")"
source ../_lib/pulp.sh

GALAXY_URL="${GALAXY_URL:-https://galaxy.ansible.com/api/}"
# The collections to mirror, in ansible-galaxy requirements.yml format.
REQUIREMENTS="${REQUIREMENTS:-collections:
  - name: ansible.posix
    version: \">=2.0.0\"
}"

# 1. Mirror what you need from Galaxy: collection remote with requirements + repository + sync.
remote="$(ensure remotes/ansible/collection ansible-upstream "$(jq -n \
  --arg url "$GALAXY_URL" --arg req "$REQUIREMENTS" \
  '{name: "ansible-upstream", url: $url, requirements_file: $req}')")"
mirror="$(ensure repositories/ansible/ansible ansible-upstream \
  "{\"name\":\"ansible-upstream\",\"remote\":\"${remote}\"}")"
echo "syncing ansible-upstream" >&2
pulp_sync "$mirror" "$remote"
ensure distributions/ansible/ansible ansible-upstream \
  "{\"name\":\"ansible-upstream\",\"base_path\":\"ansible-upstream\",\"repository\":\"${mirror}\"}" >/dev/null

# 2. Hosted repository for your own collections; ansible-galaxy publishes to it.
hosted="$(ensure repositories/ansible/ansible ansible-hosted '{"name":"ansible-hosted"}')"
ensure distributions/ansible/ansible ansible-hosted \
  "{\"name\":\"ansible-hosted\",\"base_path\":\"ansible-hosted\",\"repository\":\"${hosted}\"}" >/dev/null

show_distributions distributions/ansible/ansible ansible-

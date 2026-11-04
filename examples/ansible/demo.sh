#!/usr/bin/env bash
# Runs the client side of the Ansible tutorial against Pulp: build and publish example.hello,
# install it (and its ansible.posix dependency, from the Galaxy mirror), then run a playbook.
# Run ./setup.sh first. Requires ansible-core 2.15 or later.
set -euo pipefail

cd "$(dirname "$0")"
source ../_lib/pulp.sh

VERSION="${VERSION:-1.0.0}"
GALAXY="${PULP_URL}/pulp_ansible/galaxy/${PULP_DOMAIN:+${PULP_DOMAIN}/}"
# ansible.cfg defines the servers; these variables point them at your Pulp.
export ANSIBLE_CONFIG="$PWD/ansible.cfg"
export ANSIBLE_GALAXY_SERVER_PULP_HOSTED_URL="${GALAXY}ansible-hosted/"
export ANSIBLE_GALAXY_SERVER_PULP_HOSTED_USERNAME="$PULP_USER"
export ANSIBLE_GALAXY_SERVER_PULP_HOSTED_PASSWORD="$PULP_PASSWORD"
export ANSIBLE_GALAXY_SERVER_PULP_UPSTREAM_URL="${GALAXY}ansible-upstream/"
export ANSIBLE_GALAXY_SERVER_PULP_UPSTREAM_USERNAME="$PULP_USER"
export ANSIBLE_GALAXY_SERVER_PULP_UPSTREAM_PASSWORD="$PULP_PASSWORD"

# A throwaway collections path, so every collection really comes from Pulp.
WORK="$PWD/.ansible-demo"
rm -rf "$WORK" && mkdir -p "$WORK"
export ANSIBLE_COLLECTIONS_PATH="$WORK/collections" ANSIBLE_COLLECTIONS_SCAN_SYS_PATH=false
export ANSIBLE_GALAXY_CACHE_DIR="$WORK/cache" ANSIBLE_LOCALHOST_WARNING=false

step "Build example.hello ${VERSION}"
cp -r hello-collection "$WORK/hello"
sed -i "s/^version: .*/version: ${VERSION}/" "$WORK/hello/galaxy.yml"
ansible-galaxy collection build --force "$WORK/hello" --output-path "$WORK"

step "Publish it to ${ANSIBLE_GALAXY_SERVER_PULP_HOSTED_URL}"
if ansible-galaxy collection download -p "$WORK/check" --no-deps -s pulp_hosted "example.hello:==${VERSION}" >/dev/null 2>&1; then
  echo "example.hello ${VERSION} is already in ansible-hosted, skipping the publish"
else
  ansible-galaxy collection publish -s pulp_hosted "$WORK/example-hello-${VERSION}.tar.gz"
fi

step "Install the playbook's requirements: example.hello from ansible-hosted, ansible.posix from ansible-upstream"
ansible-galaxy collection install -r playbook/requirements.yml
ansible-galaxy collection list

step "Run the playbook"
ansible-playbook -i localhost, playbook/site.yml

step "Done. Open Pulp UI: Content Management > Repositories > ansible-hosted"

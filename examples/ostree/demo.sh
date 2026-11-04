#!/usr/bin/env bash
# Runs the client side of the OSTree tutorial against Pulp, inside a Fedora container: commit the
# hello tree to a local OSTree repository, import its archive into ostree-hosted, then pull refs
# from both distributions. Run ./setup.sh first. Requires podman.
set -euo pipefail

cd "$(dirname "$0")"
source ../_lib/pulp.sh

VERSION="${VERSION:-1.0.0}"
REF="hello/stable"
FEDORA="${FEDORA_IMAGE:-registry.fedoraproject.org/fedora:42}"
fedora() {
  podman run --rm --network host -v "$PWD:/work:Z" -w /work "$FEDORA" bash -euo pipefail -c \
    "dnf -q -y install ostree >/dev/null 2>&1 && $1"
}

step "Commit the hello tree as ${REF} (${VERSION}) and archive the repository"
rm -rf build && mkdir build
fedora "ostree init --repo=build/hello-repo --mode=archive &&
  ostree commit --repo=build/hello-repo --branch=${REF} --tree=dir=hello --subject='hello ${VERSION}' &&
  tar -cf build/hello-repo.tar -C build hello-repo"

step "Import the archive into ostree-hosted (Import archive in Pulp UI)"
artifact="$(pulp POST artifacts/ -F file=@build/hello-repo.tar | jq -r .pulp_href)"
hosted="$(lookup repositories/ostree/ostree ostree-hosted)"
response="$(pulp_json POST "${hosted}import_all/" \
  -d "{\"artifact\":\"${artifact}\",\"repository_name\":\"hello-repo\"}")"
wait_task "$(jq -r .task <<<"$response")" >/dev/null

step "Pull from Pulp with ostree"
fedora "ostree init --repo=/tmp/client --mode=archive &&
  ostree remote add --repo=/tmp/client --no-gpg-verify pulp-hosted ${CONTENT_URL}/ostree-hosted/ &&
  ostree remote add --repo=/tmp/client --no-gpg-verify pulp-upstream ${CONTENT_URL}/ostree-upstream/ &&
  ostree pull --repo=/tmp/client pulp-hosted ${REF} &&
  ostree pull --repo=/tmp/client pulp-upstream stable &&
  ostree refs --repo=/tmp/client &&
  ostree cat --repo=/tmp/client pulp-hosted:${REF} /usr/bin/hello-pulp | sh"

step "Done. Open Pulp UI: Content Management > Repositories > ostree-hosted"

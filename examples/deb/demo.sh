#!/usr/bin/env bash
# Runs the client side of the APT tutorial against Pulp, inside a Debian container: build the
# hello-pulp package, upload it to apt-hosted, then install packages from both repositories
# with apt. Run ./setup.sh first. Requires podman.
set -euo pipefail

cd "$(dirname "$0")"
source ../_lib/pulp.sh

VERSION="${VERSION:-1.0.0}"
DEBIAN="${DEBIAN_IMAGE:-docker.io/library/debian:bookworm}"
debian() { podman run --rm --network host -v "$PWD:/work:Z" -w /work "$DEBIAN" bash -euo pipefail -c "$1"; }

step "Build hello-pulp ${VERSION} with dpkg-deb"
rm -rf build && mkdir build
debian "cp -r hello /tmp/hello && sed -i 's/^Version: .*/Version: ${VERSION}/' /tmp/hello/DEBIAN/control &&
  dpkg-deb --root-owner-group --build /tmp/hello build/hello-pulp_${VERSION}_all.deb"

step "Upload it to apt-hosted as distribution stable, component main (Upload content in Pulp UI)"
hosted="$(lookup repositories/deb/apt apt-hosted)"
pulp_upload content/deb/packages "build/hello-pulp_${VERSION}_all.deb" \
  -F "repository=${hosted}" -F distribution=stable -F component=main

# nginx's own dependencies (libc6, libssl3...) still come from Debian: mirror it too for real use.
step "Install from Pulp with apt"
debian "echo 'deb [trusted=yes] ${CONTENT_URL}/apt-upstream/ bookworm nginx' > /etc/apt/sources.list.d/pulp.list &&
  echo 'deb [trusted=yes] ${CONTENT_URL}/apt-hosted/ stable main' >> /etc/apt/sources.list.d/pulp.list &&
  apt-get -qq update &&
  apt-get -qq -y install hello-pulp=${VERSION} nginx >/dev/null &&
  apt-cache policy hello-pulp nginx | awk '/^[a-z]/ || /[*][*][*]/ {print; if (/[*][*][*]/) {getline; print}}' &&
  hello-pulp && nginx -v"

step "Done. Open Pulp UI: Content Management > Repositories > apt-hosted"

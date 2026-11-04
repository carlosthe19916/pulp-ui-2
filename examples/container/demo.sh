#!/usr/bin/env bash
# Runs the client side of the container tutorial against Pulp: pull through the Docker Hub cache,
# build hello-app on top of it, push it to Pulp, then run it from Pulp. Run ./setup.sh first.
set -euo pipefail

cd "$(dirname "$0")"
source ../_lib/pulp.sh

VERSION="${VERSION:-1.0.0}"
REGISTRY="${PULP_URL#*://}"
NAMESPACE="${REGISTRY}${PULP_DOMAIN:+/${PULP_DOMAIN}}"
IMAGE="${NAMESPACE}/hello-app:${VERSION}"
# The local backend serves plain http.
TLS="--tls-verify=${TLS_VERIFY:-false}"

step "Log in to ${REGISTRY}"
podman login "$TLS" -u "$PULP_USER" -p "$PULP_PASSWORD" "$REGISTRY"

step "Pull busybox through the cache: ${NAMESPACE}/docker-hub/library/busybox:1.37"
podman pull "$TLS" "${NAMESPACE}/docker-hub/library/busybox:1.37"

step "Build and push ${IMAGE}"
podman build "$TLS" --build-arg REGISTRY="${NAMESPACE}/docker-hub" -t "$IMAGE" hello-app
podman push "$TLS" "$IMAGE"

step "Remove the local copy and run ${IMAGE} from Pulp"
podman rmi -f "$IMAGE" >/dev/null
podman run --rm "$TLS" "$IMAGE"

step "Done. Open Pulp UI: Content Management > Repositories > hello-app"

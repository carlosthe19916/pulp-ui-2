---
title: Installation
sidebar_position: 1
---

# Installation

Pulp UI is distributed as a container image. It's a small Node.js server that serves the web application and proxies API requests to your Pulp server, so it doesn't need a database or storage of its own.

## Prerequisites

- A running **Pulp 3** server reachable from the Pulp UI container. To set up Pulp itself, see the [Pulp documentation](https://pulpproject.org/).
- [Podman](https://podman.io/) or Docker.

## Get the image

Container images are published to `ghcr.io/carlosthe19916/pulp-ui-2` when a release is tagged. If no release image is available yet, build it from source:

```bash
git clone https://github.com/carlosthe19916/pulp-ui-2.git
cd pulp-ui-2
podman build -t ghcr.io/carlosthe19916/pulp-ui-2:latest .
```

## Run the container

```bash
podman run -d --name pulp-ui \
  -p 8080:8080 \
  -e PULP_API_URL=https://pulp.example.com \
  ghcr.io/carlosthe19916/pulp-ui-2:latest
```

Then open [http://localhost:8080](http://localhost:8080).

`PULP_API_URL` is **required**: the container refuses to start without it. It's the base URL of your Pulp server; Pulp UI forwards every request under `/api` to it.

:::tip[API root]
If your Pulp server uses a non-default `API_ROOT`, set `PULP_API_ROOT` to match (default `/pulp`). For example, a server configured with `API_ROOT=/api/pulp/` needs `-e PULP_API_ROOT=/api/pulp`.
:::

## Compose

```yaml title="compose.yaml"
services:
  pulp-ui:
    image: ghcr.io/carlosthe19916/pulp-ui-2:latest
    ports:
      - "8080:8080"
    environment:
      PULP_API_URL: http://pulp:80
      AUTH: basic
```

## Kubernetes and OpenShift

The image runs as a non-root user and listens on port `8080`. When `NODE_EXTRA_CA_CERTS` is set, the entrypoint appends the cluster's service account and service CA bundles to it, so Pulp UI can reach Pulp over TLS signed by the cluster CA.

## Next steps

- [Configure Pulp UI](../configuration/environment.md)
- [Take your first steps](./first-steps.md)

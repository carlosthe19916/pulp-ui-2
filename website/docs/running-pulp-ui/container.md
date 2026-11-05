---
title: Container
description: Run the Pulp UI container image with Docker or Podman, point it at your Pulp server, and avoid the localhost and API_ROOT mistakes.
sidebar_label: Container
sidebar_position: 1
---

# Container

Pulp UI is one container image, `ghcr.io/carlosthe19916/pulp-ui-2`, built for amd64 and arm64. It serves the web app on port `8080` and forwards every `/api` request to your Pulp server. It keeps no state, so you can remove and recreate it at any time.

You need a running Pulp 3 server (see the [Pulp documentation](https://pulpproject.org/)) and Docker or Podman.

## Run it

```bash
podman run -d --name pulp-ui -p 8080:8080 \
  -e PULP_API_URL=https://pulp.example.com \
  ghcr.io/carlosthe19916/pulp-ui-2:latest
```

With Docker, replace `podman` with `docker`. Then open [http://localhost:8080](http://localhost:8080) and sign in with a Pulp user.

`PULP_API_URL` is required. Without it the container exits on startup and logs `You must provide PULP_API_URL environment variable`.

| Tag            | What you get                                                                |
| -------------- | --------------------------------------------------------------------------- |
| `latest`       | The current `main` branch, rebuilt on every merge.                          |
| `0.3`, `0.3.0` | A release (see [Releases](../releases.md)). Pin one of these in production. |

## Two settings people get wrong

**`localhost` is the container itself.** If Pulp runs on your machine, `PULP_API_URL=http://localhost:5003` points the UI at itself and every request fails. Use the host's name as seen from inside the container instead:

| Engine                          | `PULP_API_URL` for a Pulp on the host                                                      |
| ------------------------------- | ------------------------------------------------------------------------------------------ |
| Podman                          | `http://host.containers.internal:5003`                                                     |
| Docker Desktop (macOS, Windows) | `http://host.docker.internal:5003`                                                         |
| Docker on Linux                 | `http://host.docker.internal:5003`, and add `--add-host=host.docker.internal:host-gateway` |

**`PULP_API_ROOT` must match the server's `API_ROOT`.** The default is `/pulp`. A server with `API_ROOT=/api/pulp/` needs `-e PULP_API_ROOT=/api/pulp`. If they don't match, the UI loads but its API requests fail.

For example, against the development backend in this repository (`npm run backend:start`), which listens on port 5003 with `API_ROOT=/api/pulp/`:

```bash
podman run -d --name pulp-ui -p 8080:8080 \
  -e PULP_API_URL=http://host.containers.internal:5003 \
  -e PULP_API_ROOT=/api/pulp \
  ghcr.io/carlosthe19916/pulp-ui-2:latest
```

## TLS and reverse proxies

The browser only talks to Pulp UI. Put TLS on a reverse proxy (nginx, HAProxy, an ingress) in front of port `8080`. `PULP_API_URL` only has to be reachable from the container, not from users' browsers.

If Pulp's certificate is signed by a private CA, mount the bundle and point Node at it. The entrypoint writes to the `NODE_EXTRA_CA_CERTS` file (it appends the system CA bundle), so a read-only mount makes the container exit with `Permission denied`. Start the server directly instead:

```bash
podman run -d --name pulp-ui -p 8080:8080 \
  -v ./ca.pem:/certs/ca.pem:ro,Z \
  -e NODE_EXTRA_CA_CERTS=/certs/ca.pem \
  -e PULP_API_URL=https://pulp.internal \
  --entrypoint node \
  ghcr.io/carlosthe19916/pulp-ui-2:0.3 server/dist/index.js
```

The image runs as a non-root user (UID 1001), so it also runs on Kubernetes and OpenShift without changes. In a cluster, keep the entrypoint and point `NODE_EXTRA_CA_CERTS` at a writable path, such as an `emptyDir`. The entrypoint fills it with the cluster's service account and service CA bundles.

## Change the configuration

Environment variables are read when the container starts, so changing one means recreating the container (`podman rm -f pulp-ui`, then `run` again). See [Environment variables](./environment.md) for the full list and [Authentication](./authentication.md) for OIDC. Logo and product name are built into the image, so changing them means building your own image.

To build the image yourself:

```bash
git clone https://github.com/carlosthe19916/pulp-ui-2.git
cd pulp-ui-2
podman build -t pulp-ui:local .
```

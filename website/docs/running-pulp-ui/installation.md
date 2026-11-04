---
title: Running Pulp UI
sidebar_label: Deployment
sidebar_position: 1
---

# Running Pulp UI

This section is for operators who deploy and configure the Pulp UI itself — distinct from
[Using Pulp](../using-pulp/index.md) (end users) and [Administration](../administration/index.md)
(managing content, identity and the Pulp installation).

## Install

To install and connect Pulp UI to a Pulp server, follow
[Getting started → Installation](../getting-started/installation.md). In production the app is
served by the Express server on port 8080, serving the built client and injecting runtime
environment variables per request.

## Configure

- [Environment variables](./environment.md) — the full configuration reference (API URL, auth mode,
  branding, …).
- [Authentication](./authentication.md) — `basic`, `oidc`, or `none`.
- [Branding](./branding.md) — logo, names and URLs, baked in at build time.

:::note
Outline page — deployment specifics (reverse proxy, TLS, container image) to follow.
:::

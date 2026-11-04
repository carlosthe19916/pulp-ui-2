---
title: Signing services
sidebar_position: 8
---

# Signing services

A signing service wraps a GPG key and script so Pulp can **sign content and metadata** — RPM
metadata (`repomd.xml`), Debian `Release` files, Ansible collections, container manifests, and more.

View configured signing services under **System Management → Signing Services**. They are global.

## How they're used

Signing services are **registered on the server** (CLI/config), then **selected in the UI** where
signing applies — a repository's **Signing** section, or a sign action. The relevant ecosystem
[tutorials](../tutorials/index.md) (RPM, Debian, Ansible, Container) show where.

:::note
Outline page — full walkthrough and screenshots to follow.
:::

---
title: Signing services
sidebar_position: 8
---

# Signing services

A signing service wraps a GPG key and a signing script so Pulp can **cryptographically sign content
and metadata** — RPM metadata (`repomd.xml`), Debian `Release` files, Ansible collections, container
manifests, and more — so clients can verify what they download.

View configured signing services under **System Management → Signing Services**. They are global.

## How they're used

1. An administrator **registers** a signing service on the server (it needs the key and script on the
   Pulp host, so this is a server-side step, not a UI one).
2. In the UI, you then **select** that signing service where signing applies — for example a
   repository's **Signing** section, or a sign action on a repository.

The relevant ecosystem [tutorials](../tutorials/index.md) (RPM, Debian, Ansible, Container) show
exactly where signing is chosen for each type.

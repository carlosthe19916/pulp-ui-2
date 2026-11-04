---
title: Content guards
sidebar_position: 9
---

# Content guards

By default, content served at `/pulp/content/` is **anonymous** — anyone with the URL can download
it. A content guard attached to a [distribution](../using-pulp/serve-content.md) restricts who can,
the way a private repository or token does in Artifactory/Nexus.

Manage them under **System Management → Content Guards**.

## Protect a distribution

1. Go to **System Management → Content Guards** and **Create** a guard (pick a type below).
2. Edit the [distribution](../using-pulp/serve-content.md) you want to protect and attach the guard.
3. Clients must now satisfy the guard to download.

## Guard types

| Type              | Protects by                              |
| ----------------- | ---------------------------------------- |
| RBAC              | Pulp users/roles.                        |
| X.509 certificate | Client TLS certificate (pulp-certguard). |
| RHSM certificate  | Red Hat subscription certificate.        |
| Header            | A required HTTP header value.            |
| EnvVar header     | A header value sourced from the server.  |
| Composite         | Several guards combined (OR logic).      |
| Redirect          | Internal use (the container registry).   |

## Good to know

- A [domain](./domains.md) can set a **default content guard** applied to new distributions.
- Grant who can manage a guard via its **Manage access** row action — see
  [Object access](./object-access.md).

---
title: Domains
sidebar_position: 5
---

# Domains

A domain is an **isolated tenant** inside one Pulp installation — like running several private
Artifactory instances, or separate AWS accounts, without the extra servers. Each domain has its own
repositories, remotes, distributions, content and **storage backend**.

## What this means for you

- **Names are unique only within a domain.** Two domains can each have a repository called
  `releases` — no collisions.
- **The domain is in the URL.** Content is served at `/pulp/content/<domain>/<base-path>/`, so a
  client points at the right tenant by URL.
- **Storage is per domain.** One domain can use local disk, another S3 — handy for separating teams,
  environments or customers.
- **Identity is shared.** Users, groups and [roles](./access-control.md) are global across all
  domains; you grant a role _within_ a domain to scope what someone can do there.

## In the UI

When domains are enabled on the server, pick the active one from the selector in the masthead; every
**Content Management** page is scoped to it. If domains are disabled, there's a single implicit
`default` domain and the selector is hidden.

Creating, configuring storage for, and migrating domains is an admin task — see
[Domains](../administration/domains.md).

:::note
Domains are a tech preview in Pulp and require plugin support.
:::

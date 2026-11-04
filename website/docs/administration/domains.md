---
title: Domains
sidebar_position: 7
---

# Domains

Domains split one Pulp installation into isolated tenants, each with its own repositories, remotes,
content and storage — like running separate Artifactory instances, but on one server. For what a
domain _is_ and how it affects content URLs, see [Domains](../concepts/domains.md); this page covers
the admin side.

Manage them under **System Management → Domains**.

## Create a domain

1. Go to **System Management → Domains** and click **Create**.
2. Name the domain (the name appears in content URLs, e.g. `/pulp/content/<domain>/...`).
3. Choose a **storage backend**: local filesystem, Amazon S3, or Azure — each domain stores its
   bytes independently.
4. Save. Users then pick the domain from the selector to work in it.

## Other tasks

- **Edit or delete** a domain from its row.
- **Migrate** a domain's storage when you change backends.

## Good to know

- [Users, groups and roles](./roles-and-permissions.md) stay **global** across all domains.
- When domains are disabled on the server, the page shows a disabled empty state.

:::note
Domains are a tech preview in Pulp.
:::

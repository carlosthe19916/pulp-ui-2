---
title: Domains
sidebar_position: 5
---

# Domains

Domains split a single Pulp installation into isolated tenants, each with its own repositories, remotes, content and storage backend. The domain name appears in content URLs, for example `/pulp/content/<domain>/<base-path>/`, and names only have to be unique within a domain — two domains can each have a repository called `releases`. Users, groups and roles stay global across domains.

When domains are enabled on the server, choose the active domain from the selector; all **Content Management** pages are scoped to it. Creating and managing domains is an admin task — see [Domains](../administration/domains.md).

:::note
This page is a work in progress. Contributions are welcome on [GitHub](https://github.com/carlosthe19916/pulp-ui-2/tree/main/website/docs/concepts/domains.md).
:::

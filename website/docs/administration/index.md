---
title: Administration
sidebar_label: Overview
sidebar_position: 1
---

# Administration

This is the admin guide: managing **who can do what** and the **shape of the Pulp installation**.
These tasks live under the **Administration** and **System Management** groups in the navigation.
For running and configuring the Pulp UI itself (install, auth modes, branding), see
[Running Pulp UI](../running-pulp-ui/environment.md).

## Identity and access

- [Users](./users.md) · [Groups](./groups.md) · [Roles & permissions](./roles-and-permissions.md)
- [Granting access to objects](./object-access.md) — per-repository/remote/distribution roles.
- [Access policies](./access-policies.md) — advanced viewset rules.

See [Access control](../concepts/access-control.md) for the concepts.

## System

- [Domains](./domains.md) — multi-tenancy and storage backends.
- [Signing services](./signing-services.md) — sign packages and metadata.
- [Content guards](./content-guards.md) — protect served content.
- [Alternate content sources](./alternate-content-sources.md) — faster/closer mirrors.
- [Storage](./storage.md) — artifacts and uploads.
- [Export & import](./export-import.md) — air-gapped transfer.
- [Replication](./replication.md) — mirror another Pulp.
- [Maintenance](./maintenance.md) — orphan cleanup and repair.
- [Monitoring](./monitoring.md) — dashboard, tasks, schedules, workers, vulnerability reports.

:::note
RBAC note (see [Access control](../concepts/access-control.md)): the UI **disables** actions a user
can't perform rather than hiding them.
:::

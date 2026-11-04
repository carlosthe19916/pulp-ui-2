---
title: Scan RPM content for vulnerabilities
sidebar_label: Scan for vulnerabilities
sidebar_position: 1
---

# Scan RPM content for vulnerabilities

**Goal:** flag known CVEs in the packages a repository holds — Pulp's take on JFrog Xray or Quay/Clair scanning.

Prerequisites: an RPM repository with content (see the [RPM tutorial](../rpm.mdx)).

## Scan on demand

1. Open the repository → **Versions** tab → the version you want → its detail page.
2. **Kebab (⋮) → Scan for vulnerabilities.** No inputs; it runs as a [task](../../concepts/tasks.md).
3. When it finishes, a warning alert on the version page counts the affected packages.

## Scan automatically on every sync

In the **repository form → Vulnerability scanning** section, set `osv_config` (JSON). Each sync then scans the new version, so a mirror is checked as it updates.

## Where results live

| Where                                  | What you see                                    |
| -------------------------------------- | ----------------------------------------------- |
| Repository **Version** detail page     | A warning alert counting packages with reports. |
| **Monitoring → Vulnerability Reports** | The full report list across repositories.       |

Scanning never changes content — it only reports. To remove affected packages, [promote](./promote-with-advanced-copy.md) only the good ones or [prune](./prune-and-retention.md).

## Related

- [Monitor tasks](../../using-pulp/monitor-tasks.md) · [Versions and rollback](../../using-pulp/versions-and-rollback.md)
- Depth: [pulp_rpm docs](https://pulpproject.org/pulp_rpm/)

---
title: Scan Python packages for vulnerabilities
sidebar_label: Scan for vulnerabilities
sidebar_position: 2
---

# Scan Python packages for vulnerabilities

**Goal:** find known vulnerabilities in the packages a repository serves — like running
`pip-audit` continuously, or JFrog Xray over a PyPI repo. Pulp checks packages against the
[OSV](https://osv.dev/) database.

Set up a Python repository first with the [Python tutorial](../python.mdx).

## Two ways to scan

| When             | How                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------- |
| After every sync | On the **Python remote**, turn on the **`vulnerabilities`** switch ("scan after each sync").      |
| On demand        | Open the repository's **Version** detail page → kebab → **Scan for vulnerabilities** (no inputs). |

## Scan on demand

1. Open the repository under **Content Management → Repositories** and go to the **Versions** tab.
2. Select the version you want to check.
3. From the version page kebab, choose **Scan for vulnerabilities**. It runs as a
   [task](../../using-pulp/monitor-tasks.md).

## See the results

- The **Version** page shows a warning alert counting the packages that have reports.
- Full reports live under **Monitoring → Vulnerability Reports** — see
  [Monitoring](../../administration/monitoring.md).

## Related

- [Block packages](./blocklist-packages.md) — keep flagged packages out entirely.
- [Versions and rollback](../../using-pulp/versions-and-rollback.md)
- Plugin reference: [pulp_python vulnerability reports](https://pulpproject.org/pulp_python/)

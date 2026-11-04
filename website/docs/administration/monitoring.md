---
title: Monitoring
sidebar_position: 15
---

# Monitoring

The operational view of a Pulp installation. End users follow their own work in
[Monitor tasks](../using-pulp/monitor-tasks.md); this page covers the admin-wide surfaces.

## Dashboard

A read-only overview (**Main → Dashboard**): system health, content inventory, storage, task
activity and trend, failed tasks. One instance-wide section and one domain section.

## Tasks & schedules

- **Monitoring → Tasks** — every task across the system; open one to inspect or cancel it.
- **Task Schedules** — recurring tasks.

## Workers

**Monitoring → Workers** — the processes that run tasks, shown as an expandable list with their
status and last heartbeat.

## Vulnerability reports

**Monitoring → Vulnerability Reports** — results of scanning content (shown when a scannable plugin
such as RPM or Python is installed). A scanned repository version also shows an alert on its detail
page.

:::note
Outline page — full walkthrough and screenshots to follow. See [Tasks](../concepts/tasks.md).
:::

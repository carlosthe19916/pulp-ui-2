---
title: Monitoring
sidebar_position: 15
---

# Monitoring

The operational view of a Pulp installation. End users follow their own work in
[Monitor tasks](../using-pulp/monitor-tasks.md); this page covers the admin-wide surfaces.

## Dashboard

A read-only overview at **Main → Dashboard**: system health, content inventory, storage usage, task
activity and trend, and failed tasks. It has one instance-wide section and one section for the
selected [domain](./domains.md).

## Tasks & schedules

- **Monitoring → Tasks** — every [task](../concepts/tasks.md) across the system; open one to inspect
  it or **cancel** a running one.
- **Monitoring → Task Schedules** — recurring tasks and when they next run.

## Workers

**Monitoring → Workers** — the processes that execute tasks, as an expandable list showing each
worker's status and last heartbeat. If tasks sit in `waiting`, check here that workers are online.

## Vulnerability reports

**Monitoring → Vulnerability Reports** — results of scanning content for known CVEs, shown when a
scannable plugin (such as RPM or Python) is installed. A scanned
[repository version](../using-pulp/versions-and-rollback.md) also shows an alert on its detail page.

---
title: Tasks and async operations
sidebar_label: Tasks
sidebar_position: 7
---

# Tasks and async operations

Most writes in Pulp — sync, publish, upload-commit, delete, repair — don't finish instantly. A sync
can pull thousands of packages, so the API accepts the request and hands back a **task** you follow,
while the work runs in the background on a worker. It's the same model as a CI job or a cloud
long-running operation: you get a handle, not an immediate result.

## Task lifecycle

```
waiting ──▶ running ──▶ completed
                   └──▶ failed
                   └──▶ canceled
```

A finished task records the resources it created — the new repository version, the publication — so
you can jump straight to the result of what you started. A failed task carries the error so you can
see why.

## In Pulp UI

- The **task drawer** surfaces progress from anywhere in the app.
- Lists show a running task's status inline next to the affected resource.
- **Monitoring → Tasks** lists every task; open one to read its detail, or cancel a running one.

You rarely wait on a screen: start a sync, keep working, and check back. See
[Monitor tasks](../using-pulp/monitor-tasks.md) for the day-to-day view, and
[Monitoring](../administration/monitoring.md) for schedules, workers and task cleanup.

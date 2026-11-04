---
title: Tasks and async operations
sidebar_label: Tasks
sidebar_position: 7
---

# Tasks and async operations

Most writes in Pulp — sync, publish, upload-commit, delete, repair — don't finish immediately. The
API accepts the request and returns a **task** you follow; the work happens in the background on a
worker.

## Task lifecycle

```
waiting ──▶ running ──▶ completed
                   └──▶ failed
                   └──▶ canceled
```

A finished task records the resources it created (for example the new repository version or
publication), so you can see the result of what you started.

## In Pulp UI

- The **task drawer** surfaces progress from anywhere in the app.
- Lists show a running task's status inline next to the affected resource.
- **Monitoring → Tasks** lists all tasks; open one to see its detail, or cancel a running one.

See [Monitor tasks](../using-pulp/monitor-tasks.md) for the end-user view, and
[Monitoring](../administration/monitoring.md) for schedules, workers and cleanup.

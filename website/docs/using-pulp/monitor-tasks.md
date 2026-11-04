---
title: Monitor tasks
sidebar_label: Monitor tasks
sidebar_position: 9
---

# Monitor tasks

Long-running operations in Pulp run as tasks. **Monitoring → Tasks** lists them with their state, so you can follow a running sync or find out why one failed. Resources with a running task also show its status inline in their lists, and the task drawer reports progress from anywhere in the app. You can cancel a running task from its detail page.

## Follow a task

| Where                     | Use it for                                                           |
| ------------------------- | -------------------------------------------------------------------- |
| **Task drawer** (top bar) | Live progress of what you just started, from any page.               |
| Inline status in a list   | A repository/remote shows its running sync without leaving the list. |
| **Monitoring → Tasks**    | The full history; filter by state, open one for details or logs.     |

Open a running task's detail page to **Cancel** it. A failed task shows the error and traceback so
you can see why a sync or publish didn't finish.

For why writes are asynchronous and the task lifecycle (waiting → running → completed / failed /
canceled), see [Tasks and async operations](../concepts/tasks.md). Admins managing task **schedules**,
**workers** and cleanup should see [Monitoring](../administration/monitoring.md).

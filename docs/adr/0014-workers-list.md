---
name: workers-list
description: Workers are a global Monitoring list with expandable rows (status, current task, component versions) and no detail page.
status: Accepted
---

# 0014. Workers are a list with expandable rows, not a page

## Context

Pulp's task workers report a heartbeat, the versions of the components they run and the task
they are running. Workers belong to the whole installation, not to a domain. The API can read
one worker, but that read returns exactly what the list row already holds, and nothing else
in Pulp links to a worker: tasks no longer record which worker ran them. A worker that stops
heartbeating is shown as missing and soon removed by the other workers, so a link to one
breaks when it goes away.

## Rules

- [ ] Workers have a page in **Monitoring**; it is global, so its address carries no domain.
- [ ] Each row shows the worker's name, whether it is online or missing, the task it is
      running (linked to that task) or that it is idle, its last heartbeat and when it
      started.
- [ ] The list filters by name and by status (online or missing), and sorts by name, last
      heartbeat and start time.
- [ ] Expanding a row shows the versions of the components the worker runs, and its PRN.
- [ ] Workers have no detail page and no actions: the API can't change or stop them.
- [ ] The list refreshes itself, since heartbeats and running tasks change constantly.

## Consequences

- Everything known about a worker is one expand away from the list, with no page that can
  break when the worker goes away.
- If Pulp starts linking tasks to workers again, a worker detail page with a Tasks tab
  becomes worth a new record.

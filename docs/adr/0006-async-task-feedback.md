---
name: async-task-feedback
description: Async writes show started/finished toasts, server-derived task status on rows and pages, and pause repository writes while a task runs.
status: Accepted (amended by 0009)
---

# 0006. Long-running work is shown as tasks

## Context

Most Pulp writes (sync, publish, content changes, most deletes and updates) are asynchronous:
the server answers with a task that runs later and may fail.

## Rules

- [ ] Starting a task shows an info toast naming the action, with a link to the task.
- [ ] Rows and pages show the object's current task status, derived from the server, so it
      survives reloads and covers tasks started elsewhere.
- [ ] While any task runs on a repository, an inline alert says so and its write actions are
      disabled with a tooltip; browsing keeps working. Edit stays enabled: Pulp queues an
      update behind the running task, and the edit page warns instead
      ([0009](0009-plugin-form-pages.md)).
- [ ] When a task finishes, the affected views refresh and a toast reports the outcome.
- [ ] Failure messages start with "Could not …" or "Failed to …" and say nothing changed when
      that is the case.
- [ ] A toast still appears if the user closed the modal or left the page before the request
      settled.
- [ ] A form's submission error shows inside the form and the form stays open; a success closes
      it.

## Consequences

- Users never wait on a spinner for minutes, and concurrent writes to one repository are
  avoided by the UI, not only by the server.

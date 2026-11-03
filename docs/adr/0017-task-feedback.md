---
name: task-feedback
description: Quick configuration writes wait for their task and report the outcome; other tasks toast once and go to a masthead task drawer; rows and pages show server-derived task status and pause repository writes while a task runs.
status: Accepted
---

# 0017. Task feedback: toasts once, then the task drawer

## Context

Most Pulp writes (sync, publish, content changes, most deletes and updates) are asynchronous:
the server answers with a task that runs later and may fail. A toast can only report what is
known when the response arrives; the outcome comes later, when the user may have moved on or
reloaded. The Tasks API can't filter by who started a task, so "the user's tasks" can only be
the ones started in this browser. Supersedes [0006](0006-async-task-feedback.md).

## Rules

- [ ] A toast reports a response when it arrives and is never raised later by watching a
      task. Starting a task shows an info toast naming the action, with a link to the task.
- [ ] A configuration write that runs as a task (editing, deleting or creating a remote,
      distribution, repository, ACS, exporter, domain or namespace) waits up to 10 seconds for
      it, then reports like a synchronous write: a success toast ("Remote "foo" deleted"), or
      the error in the form or as a toast. Still running after 10 seconds, it shows the
      started toast and goes to the task drawer.
- [ ] Data work (sync, publish, content changes, version delete and repair, export, import,
      storage migration, purge, maintenance, plugin actions) goes to the task drawer at once.
- [ ] A toast still appears if the user closed the modal or left the page before the request
      settled.
- [ ] Every task handed to the drawer is listed there, opened from a notification badge
      in the masthead: newest first, with the action, its live state, when it started, its
      error when it failed, the repository version it created, and a link to the task.
- [ ] The badge counts the tasks still running and calls for attention while a failed or
      canceled one is listed.
- [ ] The drawer keeps its tasks across reloads and tabs, drops them after a day, forgets them
      on logout, and offers **Clear finished**.
- [ ] When a listed task finishes, the views on screen refresh.
- [ ] Starting a task group (replicate, ACS refresh, import) shows its toast with a link to the
      task group; the drawer lists tasks only.
- [ ] Rows and pages show the object's current task status, derived from the server, so it
      survives reloads and covers tasks started elsewhere.
- [ ] While any task runs on a repository, an inline alert says so and its write actions are
      disabled with a tooltip; browsing keeps working. Edit stays enabled: Pulp queues an
      update behind the running task, and the edit page warns instead
      ([0010](0010-plugin-form-pages.md)).
- [ ] Failure messages the UI writes start with "Could not …" or "Failed to …" and say nothing
      changed when that is the case; a failed task shows Pulp's error as returned.
- [ ] A form's submission error shows inside the form and the form stays open; a success closes
      it.

## Consequences

- Users never wait on a spinner for more than 10 seconds; a quick configuration change is
  confirmed where it happened, and slower work's outcome is in the drawer.
- Whether a configuration change is quick is decided by its task, not guessed: one queued
  behind other work (a remote delete waiting for a sync that uses it) moves to the drawer.
- A content change that made no new version shows as completed with no version link; there
  is no separate "No changes" message.
- The drawer lists only this browser's tasks: tasks started from another browser, the CLI, or
  before signing in here don't show; the Tasks page lists every task.
- Concurrent writes to one repository are avoided by the UI, not only by the server.

---
name: task-history-tab
description: Remote, Repository and Distribution pages have a Tasks tab listing every task that reserved the object, counted in its title, with a help popover saying what it lists; Publication has none.
status: Accepted
---

# 0016. Detail pages show a task history

## Context

Work on a remote, repository or distribution runs as Pulp tasks
([0006](0006-how-tasks-are-reported.md)). Pulp records which objects each task reserved, so it can
list the tasks that touched one object. That list answers "what happened to this, and did it
work?" without searching the global task list. It isn't obvious which tasks a list built this
way contains: a task the object only took part in (a sync, for its remote) is listed, while the
task that created the object isn't, since the object didn't exist yet.

A publication is never reserved by a task: publishing reserves the repository, and deleting a
publication doesn't run as a task. A task history for it would always be empty.

## Rules

- [ ] The Remote, Repository and Distribution pages have a Tasks tab listing every task that
      reserved the object, in every state, with the same filters, sorting and actions as the
      global task list.
- [ ] The tab title counts those tasks.
- [ ] A help button beside the tab title opens a popover saying which tasks the list holds for
      that kind of object, that tasks in every state are listed, and that the task that created
      the object isn't.
- [ ] The Publication page has no Tasks tab.

## Consequences

- An object's history is one click from its page, in the same table as the global task list.
- The popover copy names the kinds of task per object type, so it has to follow when Pulp
  reserves objects for new tasks.
- A publication's publish task is found from its repository's Tasks tab.

---
name: plugin-form-pages
description: Create and edit of repositories, remotes, distributions and publications are dedicated per-plugin form pages with sections; edit sends only what changed, secrets are write-only, and leaving a dirty form asks first.
status: Accepted
---

# 0010. Create and edit are per-plugin form pages

## Context

Repositories, remotes, distributions and publications were created and edited in modals whose
fields came from one generic list per plugin. Every plugin got the same shape, so what defines an
object for that plugin (an Ansible requirements file, a container upstream name and tags, Debian
suites) carried the same weight as proxy settings; remotes needed a step wizard even for a
one-field edit; and clearing an optional value on edit didn't clear it on the server. Plugins
differ most in what they ask for when an object is made, so that part of
[0001](0001-plugin-specifics-are-data.md) no longer holds.

Edit was also disabled while a task ran on a repository, although Pulp accepts the update and
runs it once the task finishes.

## Rules

- [ ] Creating a repository, remote, distribution or publication, and editing a repository,
      remote or distribution, opens its own page, not a modal. A create URL doesn't name a
      plugin; an edit URL identifies the object.
- [ ] A create page's first field is Type: the installed types that have a form. It is hidden
      when there is only one. Changing it keeps the values both types' forms share (name, URL,
      credentials…).
- [ ] Each type has its own layout. The fields that define an object of that type are always
      visible; other settings sit in consistently named collapsible sections (Authentication,
      TLS, Proxy, Downloads, Timeouts, Labels…). A section opens by itself when it holds an
      error, or on edit a value that is set; a collapsed section shows a short summary.
- [ ] Long forms offer jump links to their sections; Save and Cancel stay visible while
      scrolling.
- [ ] A type without a form can't be created, and its objects can't be edited; they are still
      listed, read-only.
- [ ] Saving an edit changes only what the user changed, and Save stays disabled until something
      changes. Emptying a field clears it on the server.
- [ ] Passwords, tokens and private keys are never shown. The form says whether one is set and
      lets the user change or clear it; an untouched one stays as it is.
- [ ] Certificates, keys, YAML and JSON are edited in a code editor with upload, download and
      copy, and are checked for well-formedness before submitting.
- [ ] A failed submit shows the error at the top of the form and keeps what was typed. A
      successful one leaves the page, with the task feedback of
      [0006](0006-async-task-feedback.md): an edit to the object's detail page, a create to the
      new remote's or repository's detail page, or, for a distribution or publication (whose
      create runs as a task), to its list.
- [ ] Leaving a form with unsaved changes asks for confirmation.
- [ ] A task running on the object doesn't stop an edit: Edit stays enabled in lists and
      detail pages, and the edit page says a task is running and still lets the user save.
      Pulp queues the update and applies it once the task finishes.
- [ ] Edit permission is checked where Edit is offered and on the edit page itself: lists and
      detail pages disable Edit with the permission tooltip
      ([0008](0008-permission-aware-actions.md)), and an edit page reached without change
      permission shows the access-denied state instead of the form. An unknown or unviewable
      object shows the error state.
- [ ] Create permission can't be known in advance (Pulp exposes none): Create stays enabled, and
      a refusal shows at the top of the form.
- [ ] A detail page labels and groups an object's settings the same way its form does.

## Consequences

- Each type gets a form designed around what matters for it, and the same form serves create
  and edit.
- Supporting a new plugin includes writing its forms in code. The catalog keeps what the API
  needs (types, endpoints, capabilities).
- Distribution and publication forms are linkable pages, and both objects have a detail page
  ([0011](0011-distribution-detail-page.md), [0003](0003-detail-pages-and-expandable-rows.md)).

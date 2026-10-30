---
name: plugin-form-pages
description: Create and edit of repositories, remotes, distributions and publications are dedicated per-plugin form pages with sections; edit sends only what changed, secrets are write-only, and leaving a dirty form asks first.
status: Accepted
---

# 0009. Create and edit are per-plugin form pages

## Context

Repositories, remotes, distributions and publications were created and edited in modals whose
fields came from one generic list per plugin. Every plugin got the same shape, so what defines an
object for that plugin (an Ansible requirements file, a container upstream name and tags, Debian
suites) carried the same weight as proxy settings; remotes needed a step wizard even for a
one-field edit; and clearing an optional value on edit didn't clear it on the server. Plugins
differ most in what they ask for when an object is made, so that part of
[0001](0001-plugin-specifics-are-data.md) no longer holds.

## Rules

- [ ] Creating a repository, remote, distribution or publication, and editing a repository,
      remote or distribution, opens its own page, not a modal. A create URL doesn't name a
      plugin; an edit URL identifies the object.
- [ ] A create page's first field is Type: the installed types that have a form. It is hidden
      when there is only one. Changing it keeps the name, description, URL and credentials.
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
      successful one leaves the page: a remote or repository to its detail page, a distribution
      or publication to its list, with the task feedback of
      [0006](0006-async-task-feedback.md).
- [ ] Leaving a form with unsaved changes asks for confirmation.
- [ ] An edit page for an unknown or forbidden object shows the error state; without change
      permission, Save is disabled with the permission tooltip
      ([0008](0008-permission-aware-actions.md)).
- [ ] A detail page labels and groups an object's settings the same way its form does.

## Consequences

- Each type gets a form designed around what matters for it, and the same form serves create
  and edit.
- Supporting a new plugin now includes writing its forms: code, not only catalog data. The
  catalog keeps what the API needs (types, endpoints, capabilities).
- Distribution and publication forms become linkable pages, though those objects still have no
  detail page ([0003](0003-detail-pages-and-expandable-rows.md)).

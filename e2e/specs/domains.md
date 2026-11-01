---
area: domains
routes: [/system-management/domains]
---

# Domains

Create, edit, migrate and labels all happen in modals from the list. The default domain cannot be
edited or deleted. The page exists only when the backend has the domains feature enabled.

## List

### DOM-LIST-01 Row content

Summary: The Domains list shows each domain's name, description, storage, redirect, hide-guarded and created columns.

Requires: domains

When I open Domains from the System navigation
Then the heading is "Domains" and the column headers are, in order: Name, Description, Storage,
Redirect, Hide guarded, Created, actions
And a domain I create with a description and local-filesystem storage shows, in its row, that
description, the storage label "Local filesystem", and Redirect and Hide guarded as Yes/No labels

### DOM-LIST-02 Expand storage settings

Summary: Expanding a domain's Storage cell reveals its storage backend settings.

Requires: domains
Seed: a local-filesystem domain

Given a local-filesystem domain with a Location
When I expand its Storage cell
Then its storage settings are revealed, including the Location path

### DOM-LIST-03 Filter by name

Summary: Filtering the Domains list by name narrows it to the matching domain.

Requires: domains

Given a domain I created
When I filter the list by its name
Then only that domain is listed

## Default domain

### DOM-DEF-01 The default domain's actions are disabled

Summary: The default domain's Edit and Delete row actions are disabled.

Requires: domains

When I open the row actions of the "default" domain
Then Edit and Delete are disabled, with the tooltip "The default domain can't be edited or
deleted" (Pulp forbids editing or deleting the default domain)
And the Edit labels action is enabled, since labels are editable on every domain

## Create, edit and delete

### DOM-CRUD-01 Create, edit and delete a domain

Summary: Creating, editing and deleting a local-filesystem domain round-trips through the list and the API.

Requires: domains

When I create a local-filesystem domain with a description and a Location
Then the create dialog closes and the domain appears in the list
When I edit its description and Location and save
Then the edit dialog closes and the new description and Location are persisted (read back through
the API, since the edit form seeds its fields once from a cached query)
When I delete it and confirm
Then the row is gone

## Feature disabled

### DOM-DIS-01 Domains hidden from the navigation

Summary: With the domains feature disabled, the Domains navigation item is not shown.

On a backend with the domains feature disabled:

When I open the app
Then the navigation has no "Domains" item

### DOM-DIS-02 Disabled empty state on the domains route

Summary: Opening the domains route with the feature disabled shows the "Domains are not enabled" empty state.

On a backend with the domains feature disabled:

When I open the domains route
Then the "Domains are not enabled" empty state is shown

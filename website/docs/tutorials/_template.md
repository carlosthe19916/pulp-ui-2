---
title: <Job this ecosystem is for>
description: <One sentence: the outcome, not the screens.>
sidebar_label: <Ecosystem>
---

<!--
Template for an ecosystem page. Files starting with "_" are not rendered.

To add one:
1. Copy this file to tutorials/<ecosystem>.mdx. Lead with the jobs a person installs
   this plugin for. Do not reuse another ecosystem's outline.
2. Create examples/<ecosystem>/ with README.md, .env.example, setup.sh, demo.sh and the
   smallest project that exercises the client. setup.sh and demo.sh source
   examples/_lib/pulp.sh. Commands in the page must work as written against the local backend.
3. Add the page to the Tutorials category in website/sidebars.ts and to tutorials/index.md.

A sentence stays only when someone who already has the screen open still needs it:

- Decision. Which objects, which field is the non-obvious one, and what Pulp does instead of
  the tool the reader came from.
- Client contract. The file, URL shape, or command the in-UI snippet does not fully cover.
- Consequence. What happens later that the form never says.
- Symptom. A client error mapped to a Pulp cause.

Name a screen at most once, as a pointer. No numbered click paths, no screenshots of forms.
When Pulp can do something the UI does not expose, say what it is, why it matters, and that
it is API-only today. When the plugin cannot do something, say that as a plugin limit.
Link to the plugin docs for depth instead of copying them.
-->

# <Job this ecosystem is for>

One paragraph: the outcome, and who the reader is.

## <Primary job>

The objects and the field values that are not obvious. The client file. The trap.

## <Next job, only if this ecosystem has one>

## Troubleshooting

| Symptom | Cause and fix |
| ------- | ------------- |

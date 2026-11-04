---
title: <Ecosystem> repository manager
description: Proxy <public registry>, host your own <packages>, and point <client> at Pulp.
sidebar_label: <Ecosystem>
---

<!--
Template for an ecosystem tutorial. Files starting with "_" are not rendered.

To add a tutorial:
1. Copy this file to tutorials/<ecosystem>.mdx and fill in every section, keeping the headings.
2. Create examples/<ecosystem>/ with README.md, .env.example, setup.sh, demo.sh and the
   smallest projects that publish and consume a package (see examples/maven/).
3. Capture screenshots into website/static/img/tutorials/<ecosystem>/ from a local backend.
4. Add the page to the "Tutorials" category in website/sidebars.ts and to tutorials/index.md.

Rules: show the UI first and REST/CLI never in the body (setup.sh covers automation); every
command must work as written against the local backend; keep each step to what a reader does
and sees; link to the plugin docs for depth instead of copying them. When a step doesn't apply
to the ecosystem (no pull-through cache, no native publish), keep the heading and explain the
Pulp alternative: a synced mirror, Upload content in Pulp UI. setup.sh and demo.sh source
examples/_lib/pulp.sh for the REST helpers.
-->

# <Ecosystem> repository manager

One paragraph: what the reader ends up with, and the Nexus/Artifactory equivalent.

| Nexus / Artifactory  | Pulp |
| -------------------- | ---- |
| Proxy repository     |      |
| Hosted repository    |      |
| Group / virtual repo |      |

## Prerequisites

- Pulp UI connected to a Pulp server with `pulp_<plugin>` (see [Tutorials](./index.md))
- Client tools and versions
- The example project: [`examples/<ecosystem>`](https://github.com/carlosthe19916/pulp-ui-2/tree/main/examples/<ecosystem>)

## 1. Proxy the public registry

## 2. Host your own packages

## 3. Configure the client

## 4. Consume packages through Pulp

## 5. Publish a package

## 6. Verify in Pulp UI

## Going further

Promotion, versions and rollback, access control, maintenance.

## Troubleshooting

| Symptom | Cause and fix |
| ------- | ------------- |

## Clean up

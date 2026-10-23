---
title: First steps
sidebar_position: 2
---

# First steps

This walkthrough mirrors a typical workflow: bring content in from upstream, then make it available to clients.

## 1. Sign in

With the default `AUTH=basic`, Pulp UI shows a login form. Use the credentials of a Pulp user. See [Authentication](../configuration/authentication.md) for the other modes.

## 2. Pick a domain

If your Pulp server has domains enabled, choose the domain you want to work in. Everything under **Content Management** is scoped to it. See [Domains](../user-guide/domains.md).

## 3. Create a remote

Go to **Content Management → Remotes** and create a remote that points at the upstream source, for example a Fedora mirror for RPM or Docker Hub for containers. See [Remotes](../user-guide/remotes.md).

## 4. Create and sync a repository

Under **Repositories**, create a repository of the same type and **sync** it from the remote. The sync runs as a background task; each successful sync produces a new repository version. See [Repositories](../user-guide/repositories.md).

## 5. Publish and distribute

For content types that need one, create a **publication** from the repository version. Then create a **distribution** to serve it at a base path clients can consume. See [Publications](../user-guide/publications.md) and [Distributions](../user-guide/distributions.md).

## 6. Watch your tasks

Open **Monitoring → Tasks** to follow progress or investigate failures. See [Tasks](../user-guide/tasks.md).

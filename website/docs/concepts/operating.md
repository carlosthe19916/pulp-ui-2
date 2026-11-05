---
title: Operating Pulp
description: Stuck tasks, signing, content guards, domains and vulnerability scans. The server-side steps and side effects the console does not show.
sidebar_label: Operating Pulp
sidebar_position: 7
---

# Operating Pulp

Running a shared Pulp means handling stuck tasks, signing keys, download guards and tenants. Each of those has a step outside the console or a side effect it does not show.

## Tasks stay in `waiting`

Syncs, publishes, copies and deletes run as tasks on workers. A task that never leaves `waiting` usually means no worker is online, or another task holds a lock on the same repository. Check the workers' last heartbeat first. A failed task records the error, and a finished one records the resources it created.

## Signing

A signing service is a GPG key plus a script on the Pulp host. An administrator registers it on the server. The console cannot create one, only select a registered one:

| Plugin    | Where you select it                                                                                                                     |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| RPM       | The repository's metadata and package signing services. Publishing signs the next version. See [RPM](../tutorials/rpm.mdx).             |
| Debian    | The repository, to sign `Release`. See [APT](../tutorials/deb.mdx).                                                                     |
| Container | The repository signs manifests as they are added, and **Sign images** signs existing tags. See [Container](../tutorials/container.mdx). |
| Ansible   | **Sign collections**. See [Ansible](../tutorials/ansible.mdx).                                                                          |

Pulp stores the signature. Enforcement is up to the client: a container pull is not rejected because a signature is missing.

## Content guards

A guard decides who can download from a distribution. Without one, the URL is anonymous (see [What clients see](./what-clients-see.md)).

| Type              | Admits a client that presents                      |
| ----------------- | -------------------------------------------------- |
| RBAC              | A Pulp user with a role on the guard.              |
| X.509 certificate | A client TLS certificate signed by the guard's CA. |
| RHSM certificate  | A Red Hat subscription certificate.                |
| Header            | A required HTTP header value.                      |
| EnvVar header     | A header value taken from the server environment.  |
| Composite         | Any one of several guards.                         |
| Redirect          | Internal, used by the container registry.          |

A domain can set a default guard for new distributions. It does not apply to distributions that already exist. Adding a guard to a distribution clients already use breaks them until they send credentials.

## Domains

A domain is a tenant on one server. Each domain has its own:

- Names. Two domains can each have a repository called `releases`.
- URLs. Content is served at `/pulp/content/<domain>/<base-path>/`.
- Storage backend (local disk, S3 or Azure). Changing the backend means migrating that domain's bytes.

Users, groups and roles are global. Grant a role at domain scope to limit someone to one tenant (see [Who can push](./access-control.md)). With domains disabled, there is one implicit `default` domain. Domains are a tech preview in Pulp and need support from each plugin.

## Vulnerability scans

RPM and Python can scan a repository version for known CVEs, on demand or after each sync. A scan only reports and changes nothing. To stop shipping a vulnerable package, prune it, promote without it, or block it (Python).

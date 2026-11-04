# Examples

Runnable companions to the [tutorials](../website/docs/tutorials/index.md). Each folder sets up Pulp
as the repository manager for one ecosystem and drives the native client against it.

| Folder            | Tutorial                                                        |
| ----------------- | --------------------------------------------------------------- |
| [maven](./maven/) | [Maven repository manager](../website/docs/tutorials/maven.mdx) |

Every folder has the same entry points:

| File           | Purpose                                                                    |
| -------------- | -------------------------------------------------------------------------- |
| `.env.example` | Pulp URL, domain and credentials. Copy it to `.env`.                       |
| `setup.sh`     | Creates the tutorial's Pulp objects through the REST API. Safe to re-run.  |
| `demo.sh`      | Runs the client side of the tutorial and exits non-zero if any step fails. |

The defaults target the local backend (`npm run backend:start`): `http://localhost:5003`, user
`admin` / `password`, domain `default`.

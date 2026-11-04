# Examples

Runnable companions to the [tutorials](../website/docs/tutorials/index.md). Each folder sets up Pulp
as the repository manager for one ecosystem and drives the native client against it.

| Folder                          | Tutorial                                                               |
| ------------------------------- | ---------------------------------------------------------------------- |
| [maven](./maven/)               | [Maven repository manager](../website/docs/tutorials/maven.mdx)        |
| [npm](./npm/)                   | [npm repository manager](../website/docs/tutorials/npm.mdx)            |
| [python](./python/)             | [Python repository manager](../website/docs/tutorials/python.mdx)      |
| [container](./container/)       | [Container registry](../website/docs/tutorials/container.mdx)          |
| [rpm](./rpm/)                   | [RPM repository manager](../website/docs/tutorials/rpm.mdx)            |
| [deb](./deb/)                   | [APT repository manager](../website/docs/tutorials/deb.mdx)            |
| [gem](./gem/)                   | [RubyGems repository manager](../website/docs/tutorials/gem.mdx)       |
| [ansible](./ansible/)           | [Ansible Galaxy server](../website/docs/tutorials/ansible.mdx)         |
| [file](./file/)                 | [Generic file repository](../website/docs/tutorials/file.mdx)          |
| [hugging_face](./hugging_face/) | [Hugging Face model cache](../website/docs/tutorials/hugging_face.mdx) |
| [ostree](./ostree/)             | [OSTree repository manager](../website/docs/tutorials/ostree.mdx)      |

Every folder has the same entry points:

| File           | Purpose                                                                    |
| -------------- | -------------------------------------------------------------------------- |
| `.env.example` | Pulp URL, domain and credentials. Copy it to `.env`.                       |
| `setup.sh`     | Creates the tutorial's Pulp objects through the REST API. Safe to re-run.  |
| `demo.sh`      | Runs the client side of the tutorial and exits non-zero if any step fails. |

Both scripts source [`_lib/pulp.sh`](./_lib/pulp.sh), which reads `.env` and wraps the REST calls
(create-if-missing, sync, upload, publish, wait for tasks). Each folder's README lists the client
tools it needs besides `curl` and `jq`.

The defaults target the local backend (`npm run backend:start`): `http://localhost:5003`, user
`admin` / `password`, domain `default`.

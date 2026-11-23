/** Short guides the assistant reads on demand, so they stay out of every request. */
export const GUIDES = {
  concepts: `Pulp concepts:
- Repository: a versioned set of content. Each change makes a new repository version (0, 1, 2…); latest_version_href points at the newest. retain_repo_versions limits how many are kept.
- Remote: where a repository syncs from (url, policy, tls_validation, proxy_url). A sync is a task that creates a new version.
- Policy: immediate downloads all artifacts during sync; on_demand downloads metadata at sync and artifacts when a client first asks, then keeps them; streamed fetches on request and never keeps them.
- Publication: the metadata some plugins (rpm, file, python, deb, gem, hugging face) build from a version to serve it. Other plugins (container, npm, ansible, maven, ostree) serve a version directly.
- Distribution: makes content reachable at base_url (content app) under base_path. It serves a repository (its latest version, or for publishing plugins its latest publication), a fixed repository version, or a publication. A distribution with none of these serves nothing (404).
- Content guard: restricts who can download from a distribution.
- Domain: an isolated namespace of all of the above, when the server has domains on.
- Task: background work (sync, publish, delete…) run by workers; see the tasks guide.
- Orphans: content and artifacts in no repository version; orphan cleanup removes them.`,
  artifactory: `Artifactory to Pulp:
- Local repository → a repository without a remote; content is uploaded into it.
- Remote repository (proxy + cache) → a repository with a remote whose policy is on_demand (fetch and keep on first request) or streamed (fetch, never keep), plus a distribution to serve it. Pull-through caches exist for some plugins (container pull-through, python/npm streamed remotes).
- Virtual repository → no direct equivalent. Pulp serves one repository per distribution; to combine content, copy or sync it into one repository, or use several distributions.
- Repository layout / path → the distribution base_path; the URL is the distribution base_url.
- Permissions → roles on objects (list them with {href}list_roles/, your own with {href}my_permissions/).
- Builds, Xray → no equivalent; Pulp has vulnerability reports for some content (vuln_report on versions).`,
  "find-content": `Finding content:
1. Search the plugin's content endpoint (findEndpoints "<plugin> content"): e.g. content/rpm/packages/ (name, version, release, arch, sha256), content/python/packages/ (name, version, filename), content/npm/packages/ (name), content/file/files/ (relative_path), content/container/tags/ (name), content/ansible/collection_versions/ (namespace, name, version), content/gem/gem/ (name, version), content/maven/artifact/ (group_id, artifact_id, version).
2. With a content pulp_href: repositories/?latest_with_content=<href> lists repositories whose latest version has it; repositories/?with_content=<href> any version; distributions/?with_content=<href> where it is served.
3. Inside one version: the content endpoint with repository_version=<version href>.
4. What a version changed: the content endpoint (or content/) with repository_version_added=<version href> or repository_version_removed=<version href>.`,
  serving: `Where content is served:
- distributions/?repository=<repository href> finds distributions serving a repository directly.
- For publishing plugins, list the typed publications of the repository (findEndpoints "<plugin> publications", filter repository=<href>); each publication has a distributions field with the hrefs serving it.
- A distribution's base_url is the client URL; container distributions also have registry_path (podman pull <registry_path>:<tag>).
- 404 on a URL: the distribution serves nothing, its repository has no publication yet (publishing plugins), or the path is wrong. A content_guard may also refuse the client.`,
  tasks: `Tasks:
- tasks/?state=failed&ordering=-finished_at for failures; error.description holds the message.
- tasks/?reserved_resources=<prn of a repository or remote> for one object's tasks; a task's reserved_resources_record and created_resources name what it touched (prn: and href values).
- waiting: if unblocked_at is empty, an earlier task holds the same resources; if set, no worker is free. running: progress_reports (message, done, total).
- status/ lists online workers and component versions; workers/?missing=true lists dead workers (superusers only). A worker on other versions than the API may not take tasks.`,
  "client-setup": `Client setup (use the distribution's base_url):
- pip: pip install --index-url <base_url>simple/ <package>, or pip config set global.index-url <base_url>simple/
- dnf/yum: a .repo file with baseurl=<base_url> (and gpgcheck according to signing).
- npm: npm config set registry <base_url>
- podman/docker: podman pull <registry_path>:<tag> (registry_path is on the container distribution)
- file: download <base_url><relative_path>
- Others (ansible, gem, maven, deb, ostree, hugging face): the distribution's page in the UI shows the exact client setup.
Credentials are needed when the distribution has a content guard.`,
  api: `Reading the Pulp API:
- Lists return count, next and results; page with limit and offset. Ask for only the fields you need with fields=name,pulp_href.
- ordering=-pulp_created for newest first. Filters ending in __in take comma-separated values; __icontains matches part of a text.
- q is a filter expression: q=name__icontains="rpm" AND pulp_type="rpm.rpm" (AND, OR, NOT, parentheses).
- pulp_label_select=key=value filters by labels.
- Objects link to each other by pulp_href (and prn); read one by its pulp_href, and its sub-lists with suffixes like versions/, my_permissions/, list_roles/.`,
} as const;

export type GuideTopic = keyof typeof GUIDES;
export const GUIDE_TOPICS = Object.keys(GUIDES) as [
  GuideTopic,
  ...GuideTopic[],
];

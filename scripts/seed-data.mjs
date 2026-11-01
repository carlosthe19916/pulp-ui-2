#!/usr/bin/env node
// Seed a Pulp backend with data for every plugin, for manual UI testing.
//
//   npm run seed                 create what's missing (safe to re-run)
//   npm run seed -- --reset      delete every "seed-" object first
//   npm run seed -- --no-sync    create objects only, no sync from upstreams
//   npm run seed -- --only file,rpm
//
// Env: PULP_API_URL (http://localhost:5003), PULP_API_ROOT (/api/pulp/),
// PULP_USERNAME / PULP_PASSWORD (admin / password), PULP_DOMAIN (default).
import { readFileSync } from "node:fs";

const API_URL = (process.env.PULP_API_URL ?? "http://localhost:5003").replace(
  /\/$/,
  "",
);
const API_ROOT = `/${(process.env.PULP_API_ROOT ?? "/api/pulp/").replace(/^\/|\/$/g, "")}/`;
const DOMAIN = process.env.PULP_DOMAIN ?? "default";
const AUTH = `Basic ${Buffer.from(
  `${process.env.PULP_USERNAME ?? "admin"}:${process.env.PULP_PASSWORD ?? "password"}`,
).toString("base64")}`;

const args = process.argv.slice(2);
const RESET = args.includes("--reset");
const SYNC = !args.includes("--no-sync");
const onlyArg = args[args.indexOf("--only") + 1];
const ONLY = args.includes("--only") ? new Set(onlyArg.split(",")) : null;

const PREFIX = "seed-";
const LABELS = { seeded: "true", env: "dev" };
const FIXTURES = "https://fixtures.pulpproject.org";
const TEST_CA = readFileSync(
  new URL("../e2e/support/data/test-ca.pem", import.meta.url),
  "utf8",
);

// ---------------------------------------------------------------- API helpers

const collectionUrl = (collection, domain = DOMAIN) =>
  `${API_ROOT}${domain}/api/v3/${collection}/`;

async function request(method, path, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: { Authorization: AUTH, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status} ${text.slice(0, 300)}`);
  }
  return text ? JSON.parse(text) : {};
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Poll a task until it finishes; returns it, throwing when it failed. */
async function waitTask(href, { timeoutMs = 15 * 60_000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const task = await request("GET", href);
    if (task.state === "completed") return task;
    if (task.state === "failed" || task.state === "canceled") {
      throw new Error(
        `task ${task.state}: ${task.error?.description ?? JSON.stringify(task.error)}`,
      );
    }
    await sleep(1000);
  }
  throw new Error(`task ${href} timed out`);
}

async function findByName(collection, name, { domain, param = "name" } = {}) {
  const page = await request(
    "GET",
    `${collectionUrl(collection, domain)}?${param}=${encodeURIComponent(name)}&limit=1`,
  );
  return page.results?.[0];
}

/** Create an object unless one with its name exists; returns its href. */
async function ensure(collection, body, { domain, param = "name" } = {}) {
  const key = body[param];
  const existing = await findByName(collection, key, { domain, param });
  if (existing) return existing.pulp_href;
  const created = await request(
    "POST",
    collectionUrl(collection, domain),
    body,
  );
  if (created.task) {
    const task = await waitTask(created.task);
    return task.created_resources.find((href) => !href.includes("/tasks/"));
  }
  return created.pulp_href;
}

/** Sync a repository from a remote, unless it already has content. */
async function sync(repoHref, remoteHref, extra = {}) {
  const repo = await request("GET", repoHref);
  if (!extra.force && !repo.latest_version_href?.endsWith("/versions/0/")) {
    return;
  }
  const { force, ...body } = extra;
  void force;
  const { task } = await request("POST", `${repoHref}sync/`, {
    remote: remoteHref,
    ...body,
  });
  await waitTask(task);
}

async function publish(collection, repoHref, extra = {}) {
  const repo = await request("GET", repoHref);
  const existing = await request(
    "GET",
    `${collectionUrl(collection)}?repository_version=${encodeURIComponent(repo.latest_version_href)}&limit=1`,
  );
  if (existing.results?.[0]) return existing.results[0].pulp_href;
  const { task } = await request("POST", collectionUrl(collection), {
    repository: repoHref,
    ...extra,
  });
  return (await waitTask(task)).created_resources[0];
}

// ---------------------------------------------------------------- plugins
//
// One entry per plugin: a remote, a repository synced from it, a publication
// when the plugin publishes, and a distribution serving the result.

const PLUGINS = [
  {
    id: "file",
    remote: ["remotes/file/file", { url: `${FIXTURES}/file/PULP_MANIFEST` }],
    repository: ["repositories/file/file", { autopublish: false }],
    publication: "publications/file/file",
    distribution: "distributions/file/file",
    // A second sync adds content, so the repository has versions to compare.
    afterSync: async ({ repo }) => {
      const second = await ensure("remotes/file/file", {
        name: `${PREFIX}file-2`,
        url: `${FIXTURES}/file2/PULP_MANIFEST`,
      });
      const { latest_version_href } = await request("GET", repo);
      if (latest_version_href.endsWith("/versions/1/")) {
        await sync(repo, second, { force: true, mirror: false });
      }
    },
  },
  {
    id: "rpm",
    remote: ["remotes/rpm/rpm", { url: `${FIXTURES}/rpm-with-modules/` }],
    repository: ["repositories/rpm/rpm", {}],
    publication: "publications/rpm/rpm",
    distribution: "distributions/rpm/rpm",
  },
  {
    id: "deb",
    remote: [
      "remotes/deb/apt",
      { url: `${FIXTURES}/debian/`, distributions: "ragnarok" },
    ],
    repository: ["repositories/deb/apt", {}],
    publication: "publications/deb/apt",
    publicationBody: { simple: true },
    distribution: "distributions/deb/apt",
  },
  {
    id: "container",
    remote: [
      "remotes/container/container",
      {
        url: "https://registry-1.docker.io",
        upstream_name: "pulp/test-fixture-1",
        include_tags: ["manifest_a", "manifest_b"],
      },
    ],
    repository: ["repositories/container/container", {}],
    distribution: "distributions/container/container",
  },
  {
    id: "python",
    remote: [
      "remotes/python/python",
      { url: `${FIXTURES}/python-pypi/`, includes: ["shelf-reader"] },
    ],
    repository: ["repositories/python/python", {}],
    publication: "publications/python/pypi",
    distribution: "distributions/python/pypi",
  },
  {
    id: "ansible",
    remote: [
      "remotes/ansible/collection",
      {
        url: "https://galaxy.ansible.com/",
        requirements_file:
          "collections:\n  - name: testing.k8s_demo_collection\n",
      },
    ],
    repository: ["repositories/ansible/ansible", {}],
    distribution: "distributions/ansible/ansible",
  },
  {
    id: "gem",
    remote: ["remotes/gem/gem", { url: `${FIXTURES}/gem/` }],
    repository: ["repositories/gem/gem", {}],
    publication: "publications/gem/gem",
    distribution: "distributions/gem/gem",
  },
  {
    id: "npm",
    remote: [
      "remotes/npm/npm",
      { url: "https://registry.npmjs.org/commander/4.0.1" },
    ],
    repository: ["repositories/npm/npm", {}],
    distribution: "distributions/npm/npm",
  },
  {
    id: "ostree",
    remote: [
      "remotes/ostree/ostree",
      { url: `${FIXTURES}/ostree/small/`, depth: 0 },
    ],
    repository: ["repositories/ostree/ostree", {}],
    distribution: "distributions/ostree/ostree",
  },
  // Pull-through only: no sync, the distribution fetches on demand.
  {
    id: "maven",
    remote: ["remotes/maven/maven", { url: "https://repo1.maven.org/maven2/" }],
    repository: ["repositories/maven/maven", {}],
    distribution: "distributions/maven/maven",
    pullThrough: true,
  },
  {
    id: "hugging_face",
    remote: [
      "remotes/hugging_face/hugging-face",
      { url: "https://huggingface.co", policy: "on_demand" },
    ],
    repository: ["repositories/hugging_face/hugging-face", {}],
    distribution: "distributions/hugging_face/hugging-face",
    pullThrough: true,
  },
];

async function seedPlugin(plugin) {
  const name = `${PREFIX}${plugin.id.replace("_", "-")}`;
  const [remoteCollection, remoteBody] = plugin.remote;
  const remote = await ensure(remoteCollection, {
    name,
    ...remoteBody,
    pulp_labels: LABELS,
  });
  const [repoCollection, repoBody] = plugin.repository;
  const repo = await ensure(repoCollection, {
    name,
    description: `Seeded ${plugin.id} repository`,
    ...repoBody,
    ...(plugin.pullThrough ? {} : { remote }),
    pulp_labels: LABELS,
  });

  if (SYNC && !plugin.pullThrough) {
    await sync(repo, remote);
    await plugin.afterSync?.({ repo, remote });
  }

  let publication;
  if (plugin.publication && (SYNC || plugin.pullThrough)) {
    publication = await publish(
      plugin.publication,
      repo,
      plugin.publicationBody,
    );
  }

  await ensure(plugin.distribution, {
    name,
    base_path: name,
    ...(publication ? { publication } : { repository: repo }),
    ...(plugin.pullThrough ? { remote } : {}),
    pulp_labels: LABELS,
  });
  return `${plugin.id}: remote, repository${SYNC && !plugin.pullThrough ? " (synced)" : ""}${publication ? ", publication" : ""}, distribution`;
}

// ---------------------------------------------------------------- extras

/** Objects across the app that aren't one plugin's pipeline. */
async function seedExtras() {
  const done = [];

  // Content guards, one protecting a second file distribution.
  const rbac = await ensure("contentguards/core/rbac", {
    name: `${PREFIX}rbac-guard`,
    description: "Only users with the downloader role",
  });
  await ensure("contentguards/core/content_redirect", {
    name: `${PREFIX}redirect-guard`,
  });
  await ensure("contentguards/core/header", {
    name: `${PREFIX}header-guard`,
    header_name: "X-Seed-Token",
    header_value: "let-me-in",
  });
  await ensure("contentguards/certguard/x509", {
    name: `${PREFIX}x509-guard`,
    ca_certificate: TEST_CA,
  });
  const fileRepo = await findByName("repositories/file/file", `${PREFIX}file`);
  if (fileRepo) {
    await ensure("distributions/file/file", {
      name: `${PREFIX}file-protected`,
      base_path: `${PREFIX}file-protected`,
      repository: fileRepo.pulp_href,
      content_guard: rbac,
    });
  }
  done.push("content guards (rbac, redirect, header, x509)");

  // An alternate content source needs an on_demand remote.
  const acsRemote = await ensure("remotes/file/file", {
    name: `${PREFIX}file-acs`,
    url: `${FIXTURES}/file/PULP_MANIFEST`,
    policy: "on_demand",
  });
  await ensure("acs/file/file", {
    name: `${PREFIX}file-acs`,
    remote: acsRemote,
  });
  done.push("file alternate content source");

  // A sync that fails, so the task views have an error to show.
  const broken = await ensure("remotes/file/file", {
    name: `${PREFIX}file-broken`,
    // Its files don't match the manifest's checksums.
    url: `${FIXTURES}/file-invalid/PULP_MANIFEST`,
  });
  const brokenRepo = await ensure("repositories/file/file", {
    name: `${PREFIX}file-broken`,
    description: "Its sync fails on purpose",
    remote: broken,
  });
  if (SYNC) {
    await sync(brokenRepo, broken).catch(() => undefined);
    done.push("a failed sync task");
  }

  // Users, a group and a custom role, with roles on the file repository.
  for (const [username, first, last] of [
    ["alice", "Alice", "Admin"],
    ["bob", "Bob", "Builder"],
    ["carol", "Carol", "Viewer"],
  ]) {
    await ensure(
      "users",
      {
        username: `${PREFIX}${username}`,
        password: "seed-password-123",
        first_name: first,
        last_name: last,
        email: `${username}@example.com`,
      },
      { param: "username" },
    );
  }
  const group = await ensure("groups", { name: `${PREFIX}developers` });
  const members = await request("GET", `${group}users/`);
  for (const username of [`${PREFIX}alice`, `${PREFIX}bob`]) {
    if (!members.results?.some((member) => member.username === username)) {
      await request("POST", `${group}users/`, { username });
    }
  }
  await ensure("roles", {
    name: `${PREFIX}file-viewer`,
    description: "Can view file repositories and distributions",
    permissions: ["file.view_filerepository", "file.view_filedistribution"],
  });
  if (fileRepo) {
    const roles = await request("GET", `${fileRepo.pulp_href}list_roles/`);
    const has = (role, key, value) =>
      roles.roles?.some((r) => r.role === role && r[key]?.includes(value));
    if (!has("file.filerepository_owner", "users", `${PREFIX}bob`)) {
      await request("POST", `${fileRepo.pulp_href}add_role/`, {
        role: "file.filerepository_owner",
        users: [`${PREFIX}bob`],
      });
    }
    if (!has("file.filerepository_viewer", "groups", `${PREFIX}developers`)) {
      await request("POST", `${fileRepo.pulp_href}add_role/`, {
        role: "file.filerepository_viewer",
        groups: [`${PREFIX}developers`],
      });
    }
  }
  done.push("users (seed-alice, seed-bob, seed-carol), a group, a custom role");

  // A second domain with its own repository, when domains are on.
  const status = await request("GET", `${API_ROOT}api/v3/status/`);
  if (status.domain_enabled) {
    await ensure("domains", {
      name: `${PREFIX}domain`,
      description: "A second domain to switch to",
      storage_class: "pulpcore.app.models.storage.FileSystem",
      storage_settings: { MEDIA_ROOT: "/var/lib/pulp/media/artifact" },
    });
    await ensure(
      "repositories/file/file",
      { name: `${PREFIX}file-in-domain`, pulp_labels: LABELS },
      { domain: `${PREFIX}domain` },
    );
    done.push("domain seed-domain with a repository");
  }
  return done;
}

// ---------------------------------------------------------------- reset

// Dependents first: distributions before what they serve, and so on.
const RESET_ORDER = [
  "distributions",
  "acs",
  "repositories",
  "remotes",
  "contentguards",
];

async function deleteAll(collection, { domain, param = "name" } = {}) {
  const page = await request(
    "GET",
    `${collectionUrl(collection, domain)}?${param}__startswith=${PREFIX}&limit=200`,
  ).catch(() => ({ results: [] }));
  await Promise.all(
    (page.results ?? []).map(async ({ pulp_href }) => {
      const res = await request("DELETE", pulp_href);
      if (res.task) await waitTask(res.task).catch(() => undefined);
    }),
  );
  return page.results?.length ?? 0;
}

async function reset() {
  const status = await request("GET", `${API_ROOT}api/v3/status/`);
  if (status.domain_enabled) {
    const domain = await findByName("domains", `${PREFIX}domain`);
    if (domain) {
      for (const collection of RESET_ORDER) {
        await deleteAll(collection, { domain: `${PREFIX}domain` });
      }
    }
  }
  let count = 0;
  for (const collection of RESET_ORDER) count += await deleteAll(collection);
  count += await deleteAll("users", { param: "username" });
  count += await deleteAll("groups");
  count += await deleteAll("roles");
  if (status.domain_enabled) count += await deleteAll("domains");
  console.log(`reset: deleted ${count} seed objects`);
}

// ---------------------------------------------------------------- main

async function main() {
  const status = await request("GET", `${API_ROOT}api/v3/status/`).catch(
    (error) => {
      throw new Error(`Pulp isn't reachable at ${API_URL}: ${error.message}`);
    },
  );
  const installed = new Set(status.versions.map((v) => v.component));
  console.log(`Seeding ${API_URL}${API_ROOT} (domain "${DOMAIN}")`);

  if (RESET) await reset();

  const plugins = PLUGINS.filter(
    (plugin) => installed.has(plugin.id) && (!ONLY || ONLY.has(plugin.id)),
  );
  const results = await Promise.allSettled(plugins.map(seedPlugin));
  let failed = 0;
  results.forEach((result, index) => {
    if (result.status === "fulfilled") console.log(`  ✔ ${result.value}`);
    else {
      failed++;
      console.log(`  ✘ ${plugins[index].id}: ${result.reason.message}`);
    }
  });

  if (!ONLY || ONLY.has("extras")) {
    try {
      for (const line of await seedExtras()) console.log(`  ✔ ${line}`);
    } catch (error) {
      failed++;
      console.log(`  ✘ extras: ${error.message}`);
    }
  }

  console.log(
    failed
      ? `Done with ${failed} failure(s); re-run to retry what's missing.`
      : "Done.",
  );
  process.exitCode = failed ? 1 : 0;
}

await main();

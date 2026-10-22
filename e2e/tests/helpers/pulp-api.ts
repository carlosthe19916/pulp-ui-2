import { request, type APIRequestContext } from "@playwright/test";

import { E2E_PASSWORD, E2E_USERNAME } from "./auth";

const PULP_API_URL = process.env.PULP_API_URL ?? "http://localhost:8080";

const authHeader =
  "Basic " + Buffer.from(`${E2E_USERNAME}:${E2E_PASSWORD}`).toString("base64");

interface IListResponse {
  results?: { pulp_href?: string }[];
}

/** A created Pulp resource, with the PRN the row-status feature joins tasks on. */
export interface ICreatedResource {
  pulp_href: string;
  prn: string;
}

interface ITaskResponse {
  state?: string;
  created_resources?: string[];
  error?: unknown;
}

const TERMINAL_TASK_STATES = ["completed", "failed", "canceled", "skipped"];

interface IRoleAssignment {
  role: string;
}

interface IRoleRecord {
  pulp_href?: string;
  description?: string | null;
}

/**
 * Thin Pulp REST client used only as a test safety-net: it removes records a
 * test created (by exact name) in case the UI delete step never ran because the
 * test failed earlier. It talks to the backend directly with Basic auth, mirroring
 * the domain-scoped v3 paths the app itself uses (`/api/pulp/{domain}/api/v3/...`).
 */
export class PulpApi {
  private constructor(
    private readonly ctx: APIRequestContext,
    private readonly domainSegment: string,
    /** Whether the backend reports the domains feature as enabled (from `/status`). */
    readonly domainEnabled: boolean,
  ) {}

  /** Create a client, discovering domain enablement from `/status`. */
  static async create(): Promise<PulpApi> {
    const ctx = await request.newContext({
      baseURL: PULP_API_URL,
      extraHTTPHeaders: { Authorization: authHeader },
    });

    let domainEnabled = false;
    try {
      const res = await ctx.get("/api/pulp/api/v3/status/");
      if (res.ok()) {
        const status = (await res.json()) as { domain_enabled?: boolean };
        domainEnabled = status.domain_enabled ?? false;
      }
    } catch {
      // Fall back to a domain-less path; cleanup is best-effort.
    }

    return new PulpApi(ctx, domainEnabled ? "/default" : "", domainEnabled);
  }

  private collectionUrl(collection: string): string {
    return `/api/pulp${this.domainSegment}/api/v3/${collection}/`;
  }

  private async deleteByExactName(
    collection: string,
    param: string,
    value: string,
  ): Promise<void> {
    const res = await this.ctx.get(this.collectionUrl(collection), {
      params: { [param]: value, limit: 100 },
    });
    if (!res.ok()) return;

    const { results = [] } = (await res.json()) as IListResponse;
    for (const { pulp_href } of results) {
      if (pulp_href) await this.ctx.delete(pulp_href);
    }
  }

  deleteUser(username: string): Promise<void> {
    return this.deleteByExactName("users", "username", username);
  }

  deleteRole(name: string): Promise<void> {
    return this.deleteByExactName("roles", "name", name);
  }

  deleteGroup(name: string): Promise<void> {
    return this.deleteByExactName("groups", "name", name);
  }

  deleteDomain(name: string): Promise<void> {
    return this.deleteByExactName("domains", "name", name);
  }

  deleteRemote(name: string): Promise<void> {
    return this.deleteByExactName("remotes", "name", name);
  }

  deleteRepository(name: string): Promise<void> {
    return this.deleteByExactName("repositories", "name", name);
  }

  deleteDistribution(name: string): Promise<void> {
    return this.deleteByExactName("distributions", "name", name);
  }

  /** Delete any resource by its `pulp_href` (used for records with no name filter). */
  async deleteByHref(href: string): Promise<void> {
    if (href) await this.ctx.delete(href);
  }

  /**
   * POST to a typed collection (e.g. `remotes/file/file`) that creates synchronously
   * and return the new record's `pulp_href`. Seeds fixtures without the create form.
   */
  private async postCreate(
    typedCollection: string,
    body: Record<string, unknown>,
  ): Promise<string> {
    const res = await this.ctx.post(this.collectionUrl(typedCollection), {
      data: body,
    });
    if (!res.ok()) {
      throw new Error(
        `create ${typedCollection} failed: ${res.status()} ${await res.text()}`,
      );
    }
    const { pulp_href } = (await res.json()) as { pulp_href?: string };
    return pulp_href ?? "";
  }

  /** Seed a remote of a given plugin type, e.g. `createRemote("file/file", {...})`. */
  createRemote(
    typeSlug: string,
    body: Record<string, unknown>,
  ): Promise<string> {
    return this.postCreate(`remotes/${typeSlug}`, body);
  }

  /** Seed a repository of a given plugin type, e.g. `createRepository("rpm/rpm", {...})`. */
  createRepository(
    typeSlug: string,
    body: Record<string, unknown>,
  ): Promise<string> {
    return this.postCreate(`repositories/${typeSlug}`, body);
  }

  /**
   * POST a task-returning create (e.g. a publication), poll the task to completion,
   * and return the first created resource's `pulp_href`.
   */
  async createViaTask(
    typedCollection: string,
    body: Record<string, unknown>,
  ): Promise<string> {
    const res = await this.ctx.post(this.collectionUrl(typedCollection), {
      data: body,
    });
    if (!res.ok()) {
      throw new Error(
        `create ${typedCollection} failed: ${res.status()} ${await res.text()}`,
      );
    }
    const { task } = (await res.json()) as { task?: string };
    if (!task) throw new Error(`create ${typedCollection} returned no task`);

    for (let attempt = 0; attempt < 60; attempt++) {
      const taskRes = await this.ctx.get(task);
      const taskData = (await taskRes.json()) as {
        state?: string;
        created_resources?: string[];
        error?: unknown;
      };
      if (taskData.state === "completed") {
        return taskData.created_resources?.[0] ?? "";
      }
      if (taskData.state === "failed" || taskData.state === "canceled") {
        throw new Error(
          `task ${taskData.state}: ${JSON.stringify(taskData.error)}`,
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    throw new Error(`task for ${typedCollection} did not complete in time`);
  }

  /**
   * Hrefs of publications whose repository version belongs to the given repository
   * (its `repository_version` is `<repoHref>versions/N/`). Used to confirm a
   * UI-created publication exists and to register it for cleanup.
   */
  async publicationHrefsForRepository(
    repositoryHref: string,
  ): Promise<string[]> {
    const res = await this.ctx.get(this.collectionUrl("publications"), {
      params: { limit: 100 },
    });
    if (!res.ok()) return [];
    const { results = [] } = (await res.json()) as {
      results?: { pulp_href?: string; repository_version?: string | null }[];
    };
    return results
      .filter((p) => p.repository_version?.startsWith(repositoryHref))
      .map((p) => p.pulp_href ?? "")
      .filter(Boolean);
  }

  // --- Direct REST creation returning the PRN (task-status fixtures) -------
  // These let a spec stand up exactly the resources it needs without driving the
  // (slow) create wizard, and return the `prn` so a test can assert/mock the
  // per-row task status that the UI joins on `reserved_resources_record`.

  /** Create a File repository (synchronous, 201). */
  async createFileRepository(name: string): Promise<ICreatedResource> {
    return this.createSync("repositories/file/file", { name });
  }

  /** Create a File remote (synchronous, 201). */
  async createFileRemote(name: string): Promise<ICreatedResource> {
    return this.createSync("remotes/file/file", {
      name,
      url: "https://fixtures.pulpproject.org/file/PULP_MANIFEST",
    });
  }

  /** Create a domain backed by local filesystem storage (synchronous, 201). */
  async createDomain(name: string): Promise<ICreatedResource> {
    return this.createSync("domains", {
      name,
      storage_class: "pulpcore.app.models.storage.FileSystem",
      storage_settings: { MEDIA_ROOT: "/var/lib/pulp/media/artifact" },
    });
  }

  /** Create a File distribution (asynchronous, 202 + task). */
  async createDistribution(name: string): Promise<ICreatedResource> {
    return this.createAsync("distributions/file/file", {
      name,
      base_path: `e2e/${name}`,
    });
  }

  /** Publish a repository's latest version (asynchronous, 202 + task). */
  async createPublication(repositoryHref: string): Promise<ICreatedResource> {
    return this.createAsync("publications/file/file", {
      repository: repositoryHref,
    });
  }

  /**
   * Upload a File content unit via one-shot multipart (asynchronous, 202 + task)
   * and return the created content unit's `pulp_href`. Seeds the Content list
   * without a repository, so the unit is a standalone orphan. Optional `labels`
   * let a test filter the shared list down to just its own unit.
   */
  async createFileContent(
    relativePath: string,
    labels?: Record<string, string>,
  ): Promise<string> {
    const res = await this.ctx.post(this.collectionUrl("content/file/files"), {
      multipart: {
        relative_path: relativePath,
        ...(labels ? { pulp_labels: JSON.stringify(labels) } : {}),
        file: {
          name: relativePath.split("/").pop() ?? "file.txt",
          mimeType: "text/plain",
          buffer: Buffer.from(`e2e content ${relativePath}\n`),
        },
      },
    });
    if (res.status() !== 202) {
      throw new Error(
        `Upload content failed (${res.status()}): ${await res.text()}`,
      );
    }
    const { task } = (await res.json()) as { task?: string };
    if (!task) throw new Error("Content upload returned no task href");
    const finished = await this.waitForTask(task);
    return finished.created_resources?.[0] ?? "";
  }

  /** Upload a File content unit into a repository, creating a new repository version. */
  async addFileContent(
    repositoryHref: string,
    relativePath: string,
  ): Promise<void> {
    const res = await this.ctx.post(this.collectionUrl("content/file/files"), {
      multipart: {
        relative_path: relativePath,
        repository: repositoryHref,
        file: {
          name: relativePath.split("/").pop() ?? "file.txt",
          mimeType: "text/plain",
          buffer: Buffer.from(`e2e content ${relativePath}\n`),
        },
      },
    });
    if (res.status() !== 202) {
      throw new Error(
        `Upload content failed (${res.status()}): ${await res.text()}`,
      );
    }
    const { task } = (await res.json()) as { task?: string };
    if (!task) throw new Error("Content upload returned no task href");
    await this.waitForTask(task);
  }

  private async createSync(
    collection: string,
    body: Record<string, unknown>,
  ): Promise<ICreatedResource> {
    const res = await this.ctx.post(this.collectionUrl(collection), {
      data: body,
    });
    if (!res.ok()) {
      throw new Error(
        `Create ${collection} failed (${res.status()}): ${await res.text()}`,
      );
    }
    const created = (await res.json()) as Partial<ICreatedResource>;
    if (!created.pulp_href || !created.prn) {
      throw new Error(`Create ${collection} returned no href/prn`);
    }
    return { pulp_href: created.pulp_href, prn: created.prn };
  }

  private async createAsync(
    collection: string,
    body: Record<string, unknown>,
  ): Promise<ICreatedResource> {
    const res = await this.ctx.post(this.collectionUrl(collection), {
      data: body,
    });
    if (res.status() !== 202) {
      throw new Error(
        `Expected a task from ${collection} (got ${res.status()}): ${await res.text()}`,
      );
    }
    const { task } = (await res.json()) as { task?: string };
    if (!task) throw new Error(`Create ${collection} returned no task href`);
    const finished = await this.waitForTask(task);
    const href = finished.created_resources?.[0];
    if (!href) throw new Error(`Task ${task} created no resource`);
    const got = await this.ctx.get(href);
    const created = (await got.json()) as Partial<ICreatedResource>;
    if (!created.pulp_href || !created.prn) {
      throw new Error(`Created resource ${href} has no href/prn`);
    }
    return { pulp_href: created.pulp_href, prn: created.prn };
  }

  /**
   * Poll a task to completion. This is backend task settling (there is no push
   * channel), not a UI wait — it resolves as soon as the task reaches a terminal
   * state rather than sleeping a fixed duration.
   */
  private async waitForTask(taskHref: string): Promise<ITaskResponse> {
    for (let attempt = 0; attempt < 100; attempt++) {
      const res = await this.ctx.get(taskHref);
      const task = (await res.json()) as ITaskResponse;
      if (TERMINAL_TASK_STATES.includes(task.state ?? "")) {
        if (task.state !== "completed") {
          throw new Error(
            `Task ${taskHref} ${task.state}: ${JSON.stringify(task.error)}`,
          );
        }
        return task;
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    throw new Error(`Task ${taskHref} did not finish`);
  }

  private async findOne<T>(
    collection: string,
    param: string,
    value: string,
  ): Promise<T | undefined> {
    const res = await this.ctx.get(this.collectionUrl(collection), {
      params: { [param]: value, limit: 1 },
    });
    if (!res.ok()) return undefined;
    const { results = [] } = (await res.json()) as { results?: T[] };
    return results[0];
  }

  /** The names of every role currently assigned to a user (by username). */
  async userRoleNames(username: string): Promise<string[]> {
    const user = await this.findOne<{ pulp_href?: string }>(
      "users",
      "username",
      username,
    );
    if (!user?.pulp_href) return [];
    const res = await this.ctx.get(`${user.pulp_href}roles/`, {
      params: { limit: 100 },
    });
    if (!res.ok()) return [];
    const { results = [] } = (await res.json()) as {
      results?: IRoleAssignment[];
    };
    return results.map((r) => r.role);
  }

  /** The names of every group a user belongs to (by username). */
  async userGroupNames(username: string): Promise<string[]> {
    const user = await this.findOne<{ groups?: { name: string }[] }>(
      "users",
      "username",
      username,
    );
    return (user?.groups ?? []).map((g) => g.name);
  }

  /** A role's stored description (by exact name), or undefined if not found. */
  async roleDescription(name: string): Promise<string | null | undefined> {
    const role = await this.findOne<IRoleRecord>("roles", "name", name);
    return role?.description;
  }

  /** A user's stored first name (by username), or undefined if not found. */
  async userFirstName(username: string): Promise<string | null | undefined> {
    const user = await this.findOne<{ first_name?: string | null }>(
      "users",
      "username",
      username,
    );
    return user?.first_name;
  }

  /** A domain's stored description (by exact name), or undefined if not found. */
  async domainDescription(name: string): Promise<string | null | undefined> {
    const domain = await this.findOne<{ description?: string | null }>(
      "domains",
      "name",
      name,
    );
    return domain?.description;
  }

  /** A domain's stored `storage_settings` (by exact name), or undefined if not found. */
  async domainStorageSettings(
    name: string,
  ): Promise<Record<string, unknown> | undefined> {
    const domain = await this.findOne<{
      storage_settings?: Record<string, unknown>;
    }>("domains", "name", name);
    return domain?.storage_settings;
  }

  async dispose(): Promise<void> {
    await this.ctx.dispose();
  }
}

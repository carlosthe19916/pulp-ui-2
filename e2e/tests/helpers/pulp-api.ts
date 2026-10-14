import { request, type APIRequestContext } from "@playwright/test";

import { E2E_PASSWORD, E2E_USERNAME } from "./auth";

const PULP_API_URL = process.env.PULP_API_URL ?? "http://localhost:8080";

const authHeader =
  "Basic " + Buffer.from(`${E2E_USERNAME}:${E2E_PASSWORD}`).toString("base64");

interface IListResponse {
  results?: { pulp_href?: string }[];
}

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

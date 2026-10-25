import type { PulpApi } from "./pulp-api";

type Kind =
  | "user"
  | "role"
  | "group"
  | "domain"
  | "remote"
  | "repository"
  | "distribution"
  | "contentGuard"
  // An access policy's viewset name: reset to its default, never deleted.
  | "accessPolicy"
  // A full pulp_href, for resources without a unique name (e.g. publications).
  | "href";

/**
 * Per-test tracker of records to remove after the test. Tests register a name as
 * soon as they generate it; the `cleanup` fixture runs {@link Cleanup.run} in
 * teardown so a mid-flow failure never leaves orphans behind. Deletion is by
 * exact name, so parallel workers never step on each other's data.
 */
export class Cleanup {
  private readonly items: { kind: Kind; name: string }[] = [];

  user(name: string): string {
    this.items.push({ kind: "user", name });
    return name;
  }

  role(name: string): string {
    this.items.push({ kind: "role", name });
    return name;
  }

  group(name: string): string {
    this.items.push({ kind: "group", name });
    return name;
  }

  domain(name: string): string {
    this.items.push({ kind: "domain", name });
    return name;
  }

  remote(name: string): string {
    this.items.push({ kind: "remote", name });
    return name;
  }

  repository(name: string): string {
    this.items.push({ kind: "repository", name });
    return name;
  }

  distribution(name: string): string {
    this.items.push({ kind: "distribution", name });
    return name;
  }

  contentGuard(name: string): string {
    this.items.push({ kind: "contentGuard", name });
    return name;
  }

  /** Reset a policy (by viewset name) to its default in teardown. */
  accessPolicy(viewset: string): string {
    this.items.push({ kind: "accessPolicy", name: viewset });
    return viewset;
  }

  /** Track a resource by its full `pulp_href` (e.g. a publication). */
  href(href: string): string {
    this.items.push({ kind: "href", name: href });
    return href;
  }

  async run(api: PulpApi): Promise<void> {
    // Newest first, so a distribution is gone before the repo/remote it referenced.
    for (const { kind, name } of [...this.items].reverse()) {
      if (kind === "user") await api.deleteUser(name);
      else if (kind === "role") await api.deleteRole(name);
      else if (kind === "group") await api.deleteGroup(name);
      else if (kind === "domain") await api.deleteDomain(name);
      else if (kind === "remote") await api.deleteRemote(name);
      else if (kind === "repository") await api.deleteRepository(name);
      else if (kind === "distribution") await api.deleteDistribution(name);
      else if (kind === "contentGuard") await api.deleteContentGuard(name);
      else if (kind === "href") await api.deleteByHref(name);
      else if (kind === "accessPolicy") await api.resetAccessPolicy(name);
    }
  }
}

import type { PulpApi } from "./pulp-api";

/** Upper bound on best-effort teardown, so a failure never costs a second timeout. */
const CLEANUP_BUDGET_MS = 15_000;

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

  /**
   * Best-effort teardown. Cleanup runs even after the test body failed or timed
   * out, and it shares the test's timeout budget — so it is bounded
   * ({@link CLEANUP_BUDGET_MS}) and swallows every error: a hung or disposed
   * request context must not add a second full timeout on top of a failure.
   * Whatever it cannot remove in time is swept next run by the shared `e2e-` name
   * prefix.
   */
  async run(api: PulpApi): Promise<void> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const budget = new Promise<void>((resolve) => {
      timer = setTimeout(resolve, CLEANUP_BUDGET_MS);
    });
    await Promise.race([this.deleteAll(api), budget]);
    if (timer) clearTimeout(timer);
  }

  private async deleteAll(api: PulpApi): Promise<void> {
    const remove = ({
      kind,
      name,
    }: {
      kind: Kind;
      name: string;
    }): Promise<void> => {
      switch (kind) {
        case "user":
          return api.deleteUser(name);
        case "role":
          return api.deleteRole(name);
        case "group":
          return api.deleteGroup(name);
        case "domain":
          return api.deleteDomain(name);
        case "remote":
          return api.deleteRemote(name);
        case "repository":
          return api.deleteRepository(name);
        case "distribution":
          return api.deleteDistribution(name);
        case "contentGuard":
          return api.deleteContentGuard(name);
        case "href":
          return api.deleteByHref(name);
        case "accessPolicy":
          return api.resetAccessPolicy(name);
      }
    };

    // A distribution (and an href-tracked resource like a publication) points at a
    // repository/remote, so remove those first; within each phase the deletes are
    // independent, so fire them concurrently. `allSettled` keeps one failure from
    // aborting the rest — cleanup is best-effort.
    const pointsAtAnother = (kind: Kind): boolean =>
      kind === "distribution" || kind === "href";
    const dependents = this.items.filter((item) => pointsAtAnother(item.kind));
    const rest = this.items.filter((item) => !pointsAtAnother(item.kind));
    await Promise.allSettled(dependents.map(remove));
    await Promise.allSettled(rest.map(remove));
  }
}

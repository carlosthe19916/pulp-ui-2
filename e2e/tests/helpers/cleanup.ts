import type { PulpApi } from "./pulp-api";

type Kind = "user" | "role" | "group" | "domain";

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

  async run(api: PulpApi): Promise<void> {
    // Newest first, so a group is gone before the user/role it referenced.
    for (const { kind, name } of [...this.items].reverse()) {
      if (kind === "user") await api.deleteUser(name);
      else if (kind === "role") await api.deleteRole(name);
      else if (kind === "group") await api.deleteGroup(name);
      else await api.deleteDomain(name);
    }
  }
}

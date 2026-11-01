import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

import type { Cleanup } from "./cleanup";
import { openAdministration } from "./nav";
import type { IGroupRecord, PulpApi } from "./pulp-api";
import { uniqueName } from "./unique";

// Scenarios: e2e/specs/groups.md (GRP-*).

export const NO_CHANGE = "You don't have permission to change this.";
export const NO_DELETE = "You don't have permission to delete this.";

export type Gate = "enabled" | { tooltip: string };

/** An action is enabled, or disabled (aria-disabled, still visible) with a tooltip. */
export async function expectGate(item: Locator, gate: Gate): Promise<void> {
  await expect(item).toBeVisible();
  if (gate === "enabled") {
    await expect(item).not.toHaveAttribute("aria-disabled", "true");
    return;
  }
  await expect(item).toHaveAttribute("aria-disabled", "true");
  await item.hover();
  await expect(item.page().getByRole("tooltip")).toHaveText(gate.tooltip);
}

/**
 * Remove a user's role assignments on one group. Asks the server for just those (filtered by
 * `content_object`): the user's full list spans every object other tests create in parallel,
 * and serializing one of them mid-change can fail the whole listing.
 */
export async function dropRolesOnGroup(
  api: PulpApi,
  { username, group }: { username: string; group: IGroupRecord },
): Promise<void> {
  const user = await api.user(username);
  if (!user) throw new Error(`no user "${username}"`);
  const { results = [] } = await api.getJson<{
    results?: { pulp_href: string }[];
  }>(`${user.pulp_href}roles/`, { content_object: group.pulp_href });
  for (const assignment of results) {
    await api.removeRoleAssignment(assignment.pulp_href);
  }
}

/** Create a group through the API and register it for cleanup. */
export async function seedGroup(
  api: PulpApi,
  cleanup: Cleanup,
  kind = "group",
): Promise<IGroupRecord> {
  return api.createGroup(cleanup.group(uniqueName(kind)));
}

/** Give a user a role on one group, holding exactly `permissions`. */
export async function grantOnGroup(
  api: PulpApi,
  cleanup: Cleanup,
  {
    username,
    group,
    permissions,
  }: { username: string; group: IGroupRecord; permissions: string[] },
): Promise<void> {
  const role = cleanup.role(uniqueName("role"));
  await api.createRole({ name: role, permissions });
  await api.assignRole(
    { user: username },
    { role, contentObject: group.pulp_href },
  );
}

export const permissionsFor = ({
  change,
  del,
}: {
  change: boolean;
  del: boolean;
}): string[] => [
  "core.view_group",
  ...(change ? ["core.change_group"] : []),
  ...(del ? ["core.delete_group"] : []),
];

/**
 * Resolve once the permission checks a fresh page load starts have answered and
 * rendered: `my_permissions/` and the superuser probe (`users/{id}/`). Until then
 * nothing is disabled, so asserting "enabled" earlier would pass vacuously.
 */
export function permissionsSettled(page: Page): () => Promise<void> {
  const settled = Promise.all(
    [/\/my_permissions\/$/, /\/users\/\d+\/$/].map((url) =>
      page
        .waitForResponse(
          (r) =>
            r.request().method() === "GET" && url.test(r.url().split("?")[0]),
        )
        .then((r) => r.finished()),
    ),
  );
  return async () => {
    await settled;
    // Two animation frames: React has committed the re-render the answers caused.
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
  };
}

/**
 * A file repository the second user may view directly and change only through the
 * returned group, which holds `file.filerepository_owner` on it.
 */
export async function seedRepositoryChangedThroughGroup(
  api: PulpApi,
  cleanup: Cleanup,
  username: string,
): Promise<{ repo: string; group: IGroupRecord }> {
  const repo = cleanup.repository(uniqueName("repo"));
  const { pulp_href } = await api.createFileRepository(repo);
  await api.assignRole(
    { user: username },
    { role: "file.filerepository_viewer", contentObject: pulp_href },
  );
  const group = await seedGroup(api, cleanup);
  await api.assignRole(
    { group: group.name },
    { role: "file.filerepository_owner", contentObject: pulp_href },
  );
  return { repo, group };
}

/** The "Edit" row action of a repository in the Repositories list, as `page`'s user. */
export async function repositoryEditItem(
  page: Page,
  repo: string,
): Promise<Locator> {
  const settled = permissionsSettled(page);
  await page.goto("/content-management/default/repositories");
  const grid = page.getByRole("grid", { name: "Repositories table" });
  await Promise.all([
    page.waitForResponse(
      (r) => r.request().method() === "GET" && r.url().includes(repo),
    ),
    page.getByPlaceholder("Filter by Name").fill(repo),
  ]);
  await grid
    .getByRole("row")
    .filter({ hasText: repo })
    .getByRole("button", { name: "Kebab toggle" })
    .click();
  await settled();
  return page.getByRole("menuitem", { name: "Edit", exact: true });
}

/** In-app navigation (no reload), so cached pages keep their state. */
export async function navigateInApp(
  page: Page,
  item: "Users" | "Groups",
): Promise<void> {
  await openAdministration(page);
  await page
    .getByRole("navigation", { name: "Nav" })
    .getByRole("link", { name: item, exact: true })
    .click();
  await expect(
    page.getByRole("heading", { level: 1, name: item }),
  ).toBeVisible();
}

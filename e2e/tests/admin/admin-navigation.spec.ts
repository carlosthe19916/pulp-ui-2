import type { Page } from "@playwright/test";

import { expect, test } from "../fixtures";
import type { Cleanup } from "../helpers/cleanup";
import { delayApi } from "../helpers/delayApi";
import type { PulpApi } from "../helpers/pulp-api";
import { uniqueName } from "../helpers/unique";
import { DataTable } from "../pom/DataTable";

type Kind = "user" | "group";

const nav = (page: Page) => page.getByRole("navigation", { name: "Nav" });

/**
 * Reveal the Administration pages. The docked nav starts collapsed (icons only);
 * clicking a group opens the dock with that group expanded.
 */
const openAdministration = async (page: Page) => {
  await nav(page).getByRole("button", { name: "Administration" }).click();
  await expect(
    nav(page).getByRole("button", { name: "Administration" }),
  ).toHaveAttribute("aria-expanded", "true");
};

const navLink = (page: Page, name: string) =>
  nav(page).getByRole("link", { name, exact: true });

/** Seed a user or group and return its name and detail path. */
const seed = async (
  api: PulpApi,
  cleanup: Cleanup,
  kind: Kind,
): Promise<{ name: string; path: string }> => {
  if (kind === "user") {
    const name = cleanup.user(uniqueName("user"));
    const { id } = await api.createUser({ username: name });
    return { name, path: `/admin/users/${id}` };
  }
  const name = cleanup.group(uniqueName("group"));
  const { id } = await api.createGroup(name);
  return { name, path: `/admin/groups/${id}` };
};

const detailHeading = (page: Page, name: string) =>
  page.getByRole("heading", { level: 1, name, exact: true });

const adminLists = [
  { page: "Users", path: "/admin/users", title: "Users", grid: "Users table" },
  {
    page: "Groups",
    path: "/admin/groups",
    title: "Groups",
    grid: "Groups table",
  },
  { page: "Roles", path: "/admin/roles", title: "Roles", grid: "Roles table" },
  {
    page: "Access policies",
    path: "/admin/access-policies",
    title: "Access policies",
    grid: "Access policies table",
  },
] as const;

const kinds = ["user", "group"] as const;

test.describe("Administration navigation", () => {
  test(
    "NAV-01 the Administration group links every admin page",
    { tag: "@smoke" },
    async ({ page }) => {
      for (const { page: item } of adminLists) {
        await test.step(item, async () => {
          await page.goto("/");
          await openAdministration(page);
          await navLink(page, item).click();
          await expect(
            page.getByRole("heading", { level: 1, name: item, exact: true }),
          ).toBeVisible();
          await openAdministration(page);
          await expect(navLink(page, item)).toHaveAttribute(
            "aria-current",
            "page",
          );
        });
      }
    },
  );

  test("NAV-02 a detail page keeps its parent item highlighted", async ({
    page,
    api,
    cleanup,
  }) => {
    for (const kind of kinds) {
      const item = kind === "user" ? "Users" : "Groups";
      await test.step(`${kind} → ${item}`, async () => {
        const { name, path } = await seed(api, cleanup, kind);
        await page.goto(path);
        await expect(detailHeading(page, name)).toBeVisible();
        await openAdministration(page);
        await expect(navLink(page, item)).toHaveAttribute(
          "aria-current",
          "page",
        );
      });
    }
  });

  test("NAV-03 each page sets the browser tab title", async ({
    page,
    api,
    cleanup,
  }) => {
    for (const { page: name, path, title } of adminLists) {
      await test.step(name, async () => {
        await page.goto(path);
        await expect(page).toHaveTitle(new RegExp(`^${title} · `));
      });
    }
    for (const kind of kinds) {
      const prefix = kind === "user" ? "User" : "Group";
      await test.step(`${kind} detail`, async () => {
        const { name, path } = await seed(api, cleanup, kind);
        await page.goto(path);
        await expect(page).toHaveTitle(new RegExp(`^${prefix} · ${name} · `));
      });
    }
  });

  test("NAV-04 the detail breadcrumb returns to its list", async ({
    page,
    api,
    cleanup,
  }) => {
    for (const kind of kinds) {
      const list = kind === "user" ? "Users" : "Groups";
      await test.step(`${kind} → ${list}`, async () => {
        const { name, path } = await seed(api, cleanup, kind);
        await page.goto(path);
        const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
        await expect(breadcrumb.getByRole("listitem")).toHaveText([list, name]);
        await expect(
          breadcrumb.getByRole("link", { name, exact: true }),
        ).toHaveCount(0);
        await breadcrumb.getByRole("link", { name: list, exact: true }).click();
        await expect(
          page.getByRole("heading", { level: 1, name: list, exact: true }),
        ).toBeVisible();
      });
    }
  });

  test("NAV-05 a detail URL opens directly (new tab and reload)", async ({
    page,
    context,
    api,
    cleanup,
  }) => {
    for (const kind of kinds) {
      await test.step(`${kind} in a new tab`, async () => {
        const { name, path } = await seed(api, cleanup, kind);
        const tab = await context.newPage();
        await tab.goto(path);
        await expect(detailHeading(tab, name)).toBeVisible();
        await tab.close();
      });
      await test.step(`${kind} on reload`, async () => {
        const { name, path } = await seed(api, cleanup, kind);
        await page.goto(path);
        await expect(detailHeading(page, name)).toBeVisible();
        await page.reload();
        await expect(detailHeading(page, name)).toBeVisible();
      });
    }
  });

  test("NAV-06 a detail page shows a loading state, then the content", async ({
    page,
    api,
    cleanup,
  }) => {
    for (const kind of kinds) {
      const label = kind === "user" ? "Loading user" : "Loading group";
      await test.step(kind, async () => {
        const { name, path } = await seed(api, cleanup, kind);
        const held = await delayApi(page, {
          url: (url) => url.pathname.endsWith(`${path.split("/admin")[1]}/`),
          method: "GET",
        });
        await page.goto(path);
        await expect(
          page.getByRole("progressbar", { name: label }),
        ).toBeVisible();
        held.release();
        await expect(detailHeading(page, name)).toBeVisible();
        await expect(
          page.getByRole("progressbar", { name: label }),
        ).toHaveCount(0);
      });
    }
  });

  test("NAV-07 detail-route error states show 404", async ({
    page,
    api,
    cleanup,
  }) => {
    for (const kind of kinds) {
      for (const id of ["missing", "abc", "deleted"] as const) {
        const label = {
          missing: "an id that does not exist",
          abc: "a non-numeric id (abc)",
          deleted: `an id of a deleted ${kind}`,
        }[id];
        await test.step(`${kind}: ${label}`, async () => {
          let path = `/admin/${kind}s/${id === "abc" ? "abc" : "999999999"}`;
          if (id === "deleted") {
            const seeded = await seed(api, cleanup, kind);
            path = seeded.path;
            if (kind === "user") await api.deleteUser(seeded.name);
            else await api.deleteGroup(seeded.name);
          }
          await page.goto(path);
          await expect(
            page.getByRole("heading", {
              name: "404: That page does not exist",
            }),
          ).toBeVisible();
        });
      }
    }
  });

  test("NAV-08 detail pages without view permission", async ({
    api,
    cleanup,
    secondUser,
  }) => {
    const denied = {
      user: "403: Access denied",
      group: "404: That page does not exist",
    } as const;
    const user = await secondUser.create();
    const page = await secondUser.login(user);
    for (const kind of kinds) {
      await test.step(`${kind} → ${denied[kind]}`, async () => {
        const { name, path } = await seed(api, cleanup, kind);
        await page.goto(path);
        await expect(
          page.getByRole("heading", { name: denied[kind] }),
        ).toBeVisible();
        await expect(detailHeading(page, name)).toHaveCount(0);
      });
    }
  });

  test("NAV-09 lists without view permission", async ({
    api,
    cleanup,
    secondUser,
  }) => {
    // A group exists that they may not see.
    await seed(api, cleanup, "group");
    const user = await secondUser.create();
    const page = await secondUser.login(user);
    for (const { page: name, path, grid } of adminLists) {
      await test.step(name, async () => {
        await page.goto(path);
        const table = new DataTable(page.getByRole("main"), grid);
        if (name === "Groups") {
          await expect(table.stateHeading("No groups found")).toBeVisible();
          await expect(table.stateHeading("403: Access denied")).toHaveCount(0);
        } else {
          await expect(table.stateHeading("403: Access denied")).toBeVisible();
        }
      });
    }
  });

  test("NAV-10 server error on a detail page", () => {
    test.skip(true, "Manual: needs a server failure, which isn't mocked");
  });
});

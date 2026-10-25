import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";
import { delayApi } from "./helpers/delayApi";
import type { PulpApi } from "./helpers/pulp-api";
import type { Cleanup } from "./helpers/cleanup";
import { uniqueName } from "./helpers/unique";
import { DataTable } from "./pom/DataTable";

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

test.describe("Administration navigation", () => {
  test.describe("Navigation menu", () => {
    const items = [
      { item: "Users", heading: "Users", path: "/admin/users" },
      { item: "Groups", heading: "Groups", path: "/admin/groups" },
      { item: "Roles", heading: "Roles", path: "/admin/roles" },
      {
        item: "Access policies",
        heading: "Access policies",
        path: "/admin/access-policies",
      },
    ];
    for (const { item, heading, path } of items) {
      test(
        `NAV-01 Administration links ${item}`,
        { tag: "@smoke" },
        async ({ page }) => {
          await page.goto("/");
          await openAdministration(page);
          await navLink(page, item).click();
          await expect(
            page.getByRole("heading", { level: 1, name: heading, exact: true }),
          ).toBeVisible();
          await expect(page).toHaveURL(new RegExp(`${path}$`));
          await openAdministration(page);
          await expect(navLink(page, item)).toHaveAttribute(
            "aria-current",
            "page",
          );
        },
      );
    }

    const details = [
      { kind: "user", item: "Users" },
      { kind: "group", item: "Groups" },
    ] as const;
    for (const { kind, item } of details) {
      test(`NAV-02 a ${kind}'s detail page keeps ${item} highlighted`, async ({
        page,
        api,
        cleanup,
      }) => {
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

  test.describe("Titles and breadcrumbs", () => {
    const lists = [
      { page: "Users list", path: "/admin/users", title: "Users" },
      { page: "Groups list", path: "/admin/groups", title: "Groups" },
      { page: "Roles list", path: "/admin/roles", title: "Roles" },
      {
        page: "Access policies list",
        path: "/admin/access-policies",
        title: "Access policies",
      },
    ];
    for (const { page: name, path, title } of lists) {
      test(`NAV-03 ${name} sets the tab title "${title}"`, async ({ page }) => {
        await page.goto(path);
        await expect(page).toHaveTitle(new RegExp(`^${title} · `));
      });
    }

    for (const kind of ["user", "group"] as const) {
      const prefix = kind === "user" ? "User" : "Group";
      test(`NAV-03 ${kind} detail sets the tab title "${prefix} · <name>"`, async ({
        page,
        api,
        cleanup,
      }) => {
        const { name, path } = await seed(api, cleanup, kind);
        await page.goto(path);
        await expect(page).toHaveTitle(new RegExp(`^${prefix} · ${name} · `));
      });
    }

    const crumbs = [
      { kind: "user", list: "Users" },
      { kind: "group", list: "Groups" },
    ] as const;
    for (const { kind, list } of crumbs) {
      test(`NAV-04 the ${kind} detail breadcrumb returns to ${list}`, async ({
        page,
        api,
        cleanup,
      }) => {
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

  test.describe("Direct URLs and errors", () => {
    const opens = [
      { kind: "user", how: "by typing the URL in a new tab" },
      { kind: "user", how: "by reloading the detail page" },
      { kind: "group", how: "by typing the URL in a new tab" },
      { kind: "group", how: "by reloading the detail page" },
    ] as const;
    for (const { kind, how } of opens) {
      test(`NAV-05 a ${kind} detail URL opens ${how}`, async ({
        page,
        context,
        api,
        cleanup,
      }) => {
        const { name, path } = await seed(api, cleanup, kind);
        if (how === "by typing the URL in a new tab") {
          const tab = await context.newPage();
          await tab.goto(path);
          await expect(detailHeading(tab, name)).toBeVisible();
        } else {
          await page.goto(path);
          await expect(detailHeading(page, name)).toBeVisible();
          await page.reload();
          await expect(detailHeading(page, name)).toBeVisible();
        }
      });
    }

    const loading = [
      { kind: "user", label: "Loading user" },
      { kind: "group", label: "Loading group" },
    ] as const;
    for (const { kind, label } of loading) {
      test(`NAV-06 a ${kind} detail page shows "${label}" first`, async ({
        page,
        api,
        cleanup,
      }) => {
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

    const errorIds = ["missing", "abc", "deleted"] as const;
    for (const kind of ["user", "group"] as const) {
      for (const id of errorIds) {
        const label = {
          missing: "an id that does not exist",
          abc: "a non-numeric id (abc)",
          deleted: `an id of a deleted ${kind}`,
        }[id];
        test(`NAV-07 ${kind} detail with ${label} shows 404`, async ({
          page,
          api,
          cleanup,
        }) => {
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

    const denied = [
      { kind: "user", shown: "403: Access denied" },
      { kind: "group", shown: "404: That page does not exist" },
    ] as const;
    for (const { kind, shown } of denied) {
      test(`NAV-08 a ${kind} detail page without view permission shows "${shown}"`, async ({
        api,
        cleanup,
        secondUser,
      }) => {
        const { name, path } = await seed(api, cleanup, kind);
        const user = await secondUser.create();
        const page = await secondUser.login(user);
        await page.goto(path);
        await expect(page.getByRole("heading", { name: shown })).toBeVisible();
        await expect(detailHeading(page, name)).toHaveCount(0);
      });
    }

    const lists = [
      { page: "Users", path: "/admin/users", grid: "Users table" },
      { page: "Groups", path: "/admin/groups", grid: "Groups table" },
      { page: "Roles", path: "/admin/roles", grid: "Roles table" },
      {
        page: "Access policies",
        path: "/admin/access-policies",
        grid: "Access policies table",
      },
    ] as const;
    for (const { page: name, path, grid } of lists) {
      const outcome =
        name === "Groups" ? "an empty table" : '"403: Access denied"';
      test(`NAV-09 ${name} list without admin permissions shows ${outcome}`, async ({
        api,
        cleanup,
        secondUser,
      }) => {
        // A group exists that they may not see.
        await seed(api, cleanup, "group");
        const user = await secondUser.create();
        const page = await secondUser.login(user);
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

    for (const kind of ["user", "group"] as const) {
      test(`NAV-10 server error on a ${kind} detail page`, () => {
        test.skip(true, "Manual: needs a server failure, which isn't mocked");
      });
    }
  });
});

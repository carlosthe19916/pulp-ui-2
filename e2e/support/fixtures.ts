import { test as base } from "@playwright/test";

import { E2E_AUTH } from "./helpers/auth";
import { Cleanup } from "./helpers/cleanup";
import { PulpApi } from "./helpers/pulp-api";
import { SecondUsers } from "./helpers/secondUser";
import { AccessPoliciesPage } from "./pom/AccessPoliciesPage";
import { ContentGuardsPage } from "./pom/ContentGuardsPage";
import { ContentListPage } from "./pom/ContentListPage";
import { ContentPage } from "./pom/ContentPage";
import { DomainsPage } from "./pom/DomainsPage";
import { EntityFormPage } from "./pom/EntityFormPage";
import { GroupsPage } from "./pom/GroupsPage";
import { RolesPage } from "./pom/RolesPage";
import { Toasts } from "./pom/Toasts";
import { UsersPage } from "./pom/UsersPage";

interface ITestFixtures {
  usersPage: UsersPage;
  rolesPage: RolesPage;
  groupsPage: GroupsPage;
  accessPoliciesPage: AccessPoliciesPage;
  contentGuardsPage: ContentGuardsPage;
  toasts: Toasts;
  domainsPage: DomainsPage;
  remotesPage: ContentPage;
  repositoriesPage: ContentPage;
  distributionsPage: ContentPage;
  publicationsPage: ContentPage;
  contentPage: ContentListPage;
  /** A create/edit form page (repositories, remotes, distributions, publications). */
  formPage: EntityFormPage;
  /** Register test-created names here; leftovers are removed in teardown. */
  cleanup: Cleanup;
  /** Non-admin users logged in through the basic-auth form (skips other auth modes). */
  secondUser: SecondUsers;
}

interface IWorkerFixtures {
  api: PulpApi;
}

/**
 * Extends Playwright's `test` with page objects and an API-backed cleanup tracker,
 * so specs read as intent ("create a user, assert the row, delete it") while data
 * hygiene is handled automatically.
 */
export const test = base.extend<ITestFixtures, IWorkerFixtures>({
  api: [
    // Playwright requires the first argument to be an object-destructuring
    // pattern; this fixture has no dependencies, so it must be empty.
    // eslint-disable-next-line no-empty-pattern
    async ({}, provide) => {
      const api = await PulpApi.create();
      await provide(api);
      await api.dispose();
    },
    { scope: "worker" },
  ],

  cleanup: async ({ api }, provide) => {
    const cleanup = new Cleanup();
    await provide(cleanup);
    await cleanup.run(api);
  },

  secondUser: async ({ browser, baseURL, api, cleanup }, provide, testInfo) => {
    testInfo.skip(
      E2E_AUTH !== "basic",
      "a second user logs in through the basic-auth form",
    );
    const users = new SecondUsers(browser, baseURL, api, cleanup);
    await provide(users);
    await users.close();
  },

  usersPage: async ({ page }, provide) => {
    await provide(new UsersPage(page));
  },
  rolesPage: async ({ page }, provide) => {
    await provide(new RolesPage(page));
  },
  groupsPage: async ({ page }, provide) => {
    await provide(new GroupsPage(page));
  },
  accessPoliciesPage: async ({ page }, provide) => {
    await provide(new AccessPoliciesPage(page));
  },
  contentGuardsPage: async ({ page }, provide) => {
    await provide(new ContentGuardsPage(page));
  },
  toasts: async ({ page }, provide) => {
    await provide(new Toasts(page));
  },
  domainsPage: async ({ page }, provide) => {
    await provide(new DomainsPage(page));
  },
  formPage: async ({ page }, provide) => {
    await provide(new EntityFormPage(page));
  },
  remotesPage: async ({ page }, provide) => {
    await provide(
      new ContentPage(page, {
        path: "/content-management/default/remotes",
        heading: "Remotes",
        tableName: "Remotes table",
        singular: "Remote",
        createButton: "Create remote",
      }),
    );
  },
  repositoriesPage: async ({ page }, provide) => {
    await provide(
      new ContentPage(page, {
        path: "/content-management/default/repositories",
        heading: "Repositories",
        tableName: "Repositories table",
        singular: "Repository",
        createButton: "Create repository",
      }),
    );
  },
  distributionsPage: async ({ page }, provide) => {
    await provide(
      new ContentPage(page, {
        path: "/content-management/default/distributions",
        heading: "Distributions",
        tableName: "Distributions table",
        singular: "Distribution",
        createButton: "Create distribution",
      }),
    );
  },
  publicationsPage: async ({ page }, provide) => {
    await provide(
      new ContentPage(page, {
        path: "/content-management/default/publications",
        heading: "Publications",
        tableName: "Publications table",
        singular: "Publication",
        createButton: "Create publication",
      }),
    );
  },
  contentPage: async ({ page }, provide) => {
    // Content is read-only and renders as a DataList (not the shared table POM).
    await provide(new ContentListPage(page));
  },
});

export { expect } from "@playwright/test";

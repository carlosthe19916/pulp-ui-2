import { test as base } from "@playwright/test";

import { Cleanup } from "./helpers/cleanup";
import { PulpApi } from "./helpers/pulp-api";
import { DomainsPage } from "./pom/DomainsPage";
import { GroupsPage } from "./pom/GroupsPage";
import { RolesPage } from "./pom/RolesPage";
import { UsersPage } from "./pom/UsersPage";

interface ITestFixtures {
  usersPage: UsersPage;
  rolesPage: RolesPage;
  groupsPage: GroupsPage;
  domainsPage: DomainsPage;
  /** Register test-created names here; leftovers are removed in teardown. */
  cleanup: Cleanup;
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

  usersPage: async ({ page }, provide) => {
    await provide(new UsersPage(page));
  },
  rolesPage: async ({ page }, provide) => {
    await provide(new RolesPage(page));
  },
  groupsPage: async ({ page }, provide) => {
    await provide(new GroupsPage(page));
  },
  domainsPage: async ({ page }, provide) => {
    await provide(new DomainsPage(page));
  },
});

export { expect } from "@playwright/test";

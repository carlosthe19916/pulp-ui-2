import type React from "react";

import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import { PersistentStateScopeProvider } from "@app/context/PersistentStateScope/PersistentStateScopeProvider";
import { parseSearch, stringifySearch } from "@app/utils/searchParams";

import {
  defineBrowseListState,
  useBrowseListState,
} from "./useBrowseListState";

const PACKAGES_LIST = defineBrowseListState({
  sort: {
    columnKeys: ["name", "arch"],
    defaultValue: { sortBy: "name", direction: "asc" },
  },
  filters: [{ param: "name__contains", label: "Name" }],
});

const UNSORTED_LIST = defineBrowseListState();

const Packages: React.FC = () => {
  const list = useBrowseListState(PACKAGES_LIST);
  return (
    <>
      <p>params {JSON.stringify(list.params)}</p>
      <button onClick={() => list.setFilters({ name: "bash" })}>Filter</button>
      <button onClick={list.clearAllFilters}>Clear</button>
    </>
  );
};

const Unsorted: React.FC = () => {
  const list = useBrowseListState(UNSORTED_LIST);
  return <p>params {JSON.stringify(list.params)}</p>;
};

const renderAt = async ({ url, ui }: { url: string; ui: React.FC }) => {
  const root = createRootRoute({ component: Outlet });
  const page = createRoute({
    getParentRoute: () => root,
    path: "/$pulpDomain/browse",
    component: ui,
  });
  const router = createRouter({
    routeTree: root.addChildren([page]),
    history: createMemoryHistory({ initialEntries: [url] }),
    parseSearch,
    stringifySearch,
  });
  const screen = await render(<RouterProvider router={router} />);
  return { screen, router };
};

const Scoped: React.FC = () => (
  <PersistentStateScopeProvider prefix="packages">
    <Packages />
  </PersistentStateScopeProvider>
);

describe("useBrowseListState", () => {
  it("reads the section's scoped params into the query params", async () => {
    const { screen } = await renderAt({
      url: "/d/browse?packages.page=2&packages.sortBy=arch&packages.direction=desc&packages.name=ba",
      ui: Scoped,
    });
    await expect
      .element(
        screen.getByText(
          'params {"limit":10,"offset":10,"ordering":["-arch"],"name__contains":"ba"}',
        ),
      )
      .toBeVisible();
  });

  it("goes back to page 1 on a filter change and drops defaults on clear", async () => {
    const { screen, router } = await renderAt({
      url: "/d/browse?packages.page=3",
      ui: Scoped,
    });
    await screen.getByRole("button", { name: "Filter" }).click();
    await expect
      .poll(() => router.history.location.search)
      .toBe("?packages.name=bash");

    await screen.getByRole("button", { name: "Clear" }).click();
    await expect.poll(() => router.history.location.search).toBe("");
  });

  it("sends no ordering for a list without sortable columns", async () => {
    const { screen } = await renderAt({
      url: "/d/browse?sortBy=name",
      ui: Unsorted,
    });
    await expect
      .element(screen.getByText('params {"limit":10,"offset":0}'))
      .toBeVisible();
  });
});

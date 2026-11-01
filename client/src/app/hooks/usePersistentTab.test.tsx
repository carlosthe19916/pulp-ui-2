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

import { defineTabState, usePersistentTab } from "./usePersistentTab";

const PAGE_TABS = defineTabState({
  tabs: ["details", "versions", "access"],
  defaultValue: "details",
});
const SECTION_TABS = defineTabState({ param: "section", defaultValue: "" });

const RENDERED_SECTIONS = ["rpms", "groups"];

const PageTabs: React.FC = () => {
  const { tab, setTab, selectTab } = usePersistentTab({
    ...PAGE_TABS,
    storage: "url",
  });
  return (
    <section aria-label="page">
      <p>tab {tab}</p>
      <button onClick={() => setTab("versions")}>Versions</button>
      <button onClick={() => selectTab("details")}>Details</button>
      <button onClick={() => selectTab("bogus")}>Bogus</button>
    </section>
  );
};

const Sections: React.FC = () => {
  const { tab, selectTab } = usePersistentTab({
    ...SECTION_TABS,
    storage: "url",
    available: RENDERED_SECTIONS,
  });
  return (
    <section aria-label="sections">
      <p>section {tab}</p>
      <button onClick={() => selectTab("groups")}>Groups</button>
    </section>
  );
};

const renderAt = async ({ url, ui }: { url: string; ui: React.FC }) => {
  const root = createRootRoute({ component: Outlet });
  const page = createRoute({
    getParentRoute: () => root,
    path: "/$pulpDomain/thing",
    component: ui,
  });
  const router = createRouter({
    routeTree: root.addChildren([page]),
    history: createMemoryHistory({ initialEntries: [url] }),
    parseSearch,
    stringifySearch,
  });
  const screen = await render(<RouterProvider router={router} />);
  return { screen, search: () => router.history.location.search, router };
};

describe("usePersistentTab", () => {
  it("reads the tab from the address and leaves the default out of it", async () => {
    const { screen, search } = await renderAt({
      url: "/d/thing?tab=access",
      ui: PageTabs,
    });
    await expect.element(screen.getByText("tab access")).toBeVisible();

    await screen.getByRole("button", { name: "Details" }).click();
    await expect.element(screen.getByText("tab details")).toBeVisible();
    expect(search()).toBe("");

    await screen.getByRole("button", { name: "Versions" }).click();
    expect(search()).toBe("?tab=versions");
  });

  it("falls back to the default for a tab the group doesn't have", async () => {
    const { screen } = await renderAt({
      url: "/d/thing?tab=gone",
      ui: PageTabs,
    });
    await expect.element(screen.getByText("tab details")).toBeVisible();
  });

  it("ignores an unknown key from PatternFly's onSelect", async () => {
    const { screen, search } = await renderAt({
      url: "/d/thing?tab=versions",
      ui: PageTabs,
    });
    await screen.getByRole("button", { name: "Bogus" }).click();
    await expect.element(screen.getByText("tab versions")).toBeVisible();
    expect(search()).toBe("?tab=versions");
  });

  it("doesn't add a history entry", async () => {
    const { screen, router } = await renderAt({
      url: "/d/thing",
      ui: PageTabs,
    });
    await screen.getByRole("button", { name: "Versions" }).click();
    await expect.element(screen.getByText("tab versions")).toBeVisible();
    expect(router.history.length).toBe(1);
  });

  it("checks runtime keys against the tabs rendered now", async () => {
    const { screen, search } = await renderAt({
      url: "/d/thing?section=uninstalled",
      ui: () => <Sections />,
    });
    await expect.element(screen.getByText("section rpms")).toBeVisible();

    await screen.getByRole("button", { name: "Groups" }).click();
    expect(search()).toBe("?section=groups");
  });

  it("keeps a nested group apart through its scope", async () => {
    const { screen, search } = await renderAt({
      url: "/d/thing?tab=versions&content.section=groups",
      ui: () => (
        <>
          <PageTabs />
          <PersistentStateScopeProvider prefix="content">
            <Sections />
          </PersistentStateScopeProvider>
        </>
      ),
    });
    await expect.element(screen.getByText("tab versions")).toBeVisible();
    await expect.element(screen.getByText("section groups")).toBeVisible();
    expect(search()).toBe("?tab=versions&content.section=groups");
  });
});

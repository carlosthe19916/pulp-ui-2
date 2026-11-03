import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import type { DomainResponse } from "@app/client";
import { useResourceTasks } from "@app/hooks/useResourceTasks";
import {
  useDomainDeleteMutation,
  useDomainLabelsMutation,
  useDomainsListQuery,
} from "@app/queries/domains";

import { DomainList } from "./DomainList";

// Client-only behaviour (column visibility, the task-driven Status column) with the list query
// and task probes mocked; the real backend round-trips live in e2e.
vi.mock(import("@app/queries/domains"), () => ({
  useDomainsListQuery: vi.fn(),
  useDomainDeleteMutation: vi.fn(),
  useDomainLabelsMutation: vi.fn(),
  // Statically imported by the create/edit/migrate modals (mounted only when opened).
  useDomainCreateMutation: vi.fn(),
  useDomainUpdateMutation: vi.fn(),
  useDomainMigrateMutation: vi.fn(),
  // Imported by DomainList but only used in an onSettled callback never fired here.
  domainKeys: { list: () => ["domains", "list"] } as never,
}));
vi.mock(import("@app/hooks/useResourceTasks"), () => ({
  useResourceTasks: vi.fn(),
}));
vi.mock(import("@app/hooks/useNotifications"), () => ({
  useNotifications: () => ({ addNotification: vi.fn() }),
}));

const domain: DomainResponse = {
  name: "alpha",
  pulp_href: "/pulp/api/v3/domains/1/",
  prn: "prn:domain:1",
  storage_class: "pulpcore.app.models.storage.FileSystem",
} as DomainResponse;

const setActiveCount = (count: number) => {
  vi.mocked(useResourceTasks).mockReturnValue({
    getActiveCount: () => count,
    getTaskKinds: () => (count === 1 ? ["sync"] : []),
    getTasks: () => [],
  });
};

// The list keeps its state in the URL, so it needs a router.
const renderList = () => {
  const router = createRouter({
    routeTree: createRootRoute({ component: DomainList }),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
};

beforeEach(() => {
  vi.mocked(useDomainsListQuery).mockReturnValue({
    data: { count: 1, results: [domain] },
    isLoading: false,
    error: null,
  } as unknown as ReturnType<typeof useDomainsListQuery>);
  vi.mocked(useDomainDeleteMutation).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useDomainDeleteMutation>);
  vi.mocked(useDomainLabelsMutation).mockReturnValue({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useDomainLabelsMutation>);
  setActiveCount(0);
});

describe("DomainList — Status column", () => {
  it("hides the Status column when no domain has an active task", async () => {
    const screen = await renderList();

    await expect
      .element(screen.getByRole("columnheader", { name: "Name", exact: true }))
      .toBeVisible();
    await expect
      .element(
        screen.getByRole("columnheader", { name: "Status", exact: true }),
      )
      .not.toBeInTheDocument();
  });

  it("shows the Status column when a domain has an active task", async () => {
    setActiveCount(1);
    const screen = await renderList();

    await expect
      .element(
        screen.getByRole("columnheader", { name: "Status", exact: true }),
      )
      .toBeVisible();
  });
});

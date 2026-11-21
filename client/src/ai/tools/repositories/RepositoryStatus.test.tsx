import type React from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { AxiosError, AxiosHeaders } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import type { RepositoryResponse } from "@app/client";
import { useDistributionsListQuery } from "@app/queries/distributions";
import { usePublicationsListQuery } from "@app/queries/publications";
import { useRemoteDetailQuery } from "@app/queries/remotes";
import {
  useRepositoriesListQuery,
  useRepositoryVersionDetailQuery,
  useRepositoryVersionsListQuery,
} from "@app/queries/repositories";
import { useTasksListQuery } from "@app/queries/tasks";

import { RepositoryStatus } from "./RepositoryStatus";

vi.mock(import("@app/queries/repositories"), () => ({
  useRepositoriesListQuery: vi.fn(),
  useRepositoryVersionDetailQuery: vi.fn(),
  useRepositoryVersionsListQuery: vi.fn(),
}));
vi.mock(import("@app/queries/tasks"), () => ({ useTasksListQuery: vi.fn() }));
vi.mock(import("@app/queries/remotes"), () => ({
  useRemoteDetailQuery: vi.fn(),
}));
vi.mock(import("@app/queries/publications"), () => ({
  usePublicationsListQuery: vi.fn(),
}));
vi.mock(import("@app/queries/distributions"), async (importOriginal) => ({
  ...(await importOriginal()),
  useDistributionsListQuery: vi.fn(),
}));
vi.mock(import("@app/hooks/useSelectedDomain"), () => ({
  useSelectedDomain: () => ({ enabled: false, name: "default" }),
}));

const renderInRouter = (component: React.FC) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider
        router={createRouter({
          routeTree: createRootRoute({ component }),
          history: createMemoryHistory({ initialEntries: ["/"] }),
        })}
      />
    </QueryClientProvider>,
  );

const forbidden = new AxiosError(
  "Forbidden",
  "ERR_BAD_REQUEST",
  undefined,
  undefined,
  {
    status: 403,
    statusText: "Forbidden",
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: {},
  },
);

const REPOSITORY_HREF =
  "/pulp/default/api/v3/repositories/python/python/0193-r/";

const repository: RepositoryResponse = {
  name: "pypi-mirror",
  pulp_href: REPOSITORY_HREF,
  prn: "prn:python.pythonrepository:0193-r",
  latest_version_href: `${REPOSITORY_HREF}versions/0/`,
  remote: "/pulp/default/api/v3/remotes/python/python/0193-m/",
};

const mockQuery = (hook: unknown, result: object) =>
  vi
    .mocked(hook as () => unknown)
    .mockReturnValue({ isLoading: false, error: null, ...result });

beforeEach(() => {
  mockQuery(useRepositoriesListQuery, {
    data: { count: 1, results: [repository] },
  });
  mockQuery(useRepositoryVersionDetailQuery, {
    data: {
      number: 0,
      content_summary: { added: {}, removed: {}, present: {} },
    },
  });
  mockQuery(useRepositoryVersionsListQuery, {
    data: { count: 1, results: [] },
  });
  mockQuery(useTasksListQuery, { data: { count: 0, results: [] } });
  mockQuery(usePublicationsListQuery, { data: { count: 0, results: [] } });
  mockQuery(useDistributionsListQuery, { data: { count: 0, results: [] } });
  mockQuery(useRemoteDetailQuery, {
    data: {
      name: "pypi",
      url: "https://pypi.org/",
      policy: "on_demand",
      proxy_url: "http://proxy.example.com:3128",
      tls_validation: false,
    },
  });
});

describe("RepositoryStatus", () => {
  it("flags an empty, never synced, unpublished, unserved repository", async () => {
    const screen = await renderInRouter(() => (
      <RepositoryStatus name="pypi-mirror" />
    ));

    await expect
      .element(screen.getByRole("link", { name: "pypi-mirror" }))
      .toBeVisible();
    await expect
      .element(
        screen.getByText("Empty: nothing was added yet: warning status;"),
      )
      .toBeVisible();
    await expect.element(screen.getByText("Never synced")).toBeVisible();
    await expect
      .element(
        screen.getByText(
          "None: its distributions serve nothing until it is published: warning status;",
        ),
      )
      .toBeVisible();
    await expect
      .element(
        screen.getByText(
          "No distribution points at this repository: warning status;",
        ),
      )
      .toBeVisible();
    await expect
      .element(
        screen.getByText(
          "https://pypi.org/, on_demand, through http://proxy.example.com:3128",
        ),
      )
      .toBeVisible();
    await expect
      .element(screen.getByText("TLS validation is off: warning status;"))
      .toBeVisible();
  });

  it("shows the last sync and its error", async () => {
    mockQuery(useTasksListQuery, {
      data: {
        count: 3,
        results: [
          {
            pulp_href: "/pulp/default/api/v3/tasks/0193-t/",
            name: "pulp_python.app.tasks.sync.sync",
            state: "failed",
            error: { description: "407 Proxy Authentication Required" },
          },
        ],
      },
    });
    const screen = await renderInRouter(() => (
      <RepositoryStatus name="pypi-mirror" />
    ));

    await expect
      .element(screen.getByRole("link", { name: "sync" }))
      .toBeVisible();
    await expect
      .element(screen.getByText("407 Proxy Authentication Required"))
      .toBeVisible();
    expect(vi.mocked(useTasksListQuery)).toHaveBeenCalledWith({
      params: expect.objectContaining({
        reserved_resources: repository.prn,
        name__contains: "sync",
      }),
      options: { enabled: true },
    });
  });

  it("shows a loading fact as loading, not as missing", async () => {
    mockQuery(useRemoteDetailQuery, { isLoading: true, data: undefined });
    mockQuery(useTasksListQuery, { isLoading: true, data: undefined });
    mockQuery(useDistributionsListQuery, { isLoading: true, data: undefined });
    const screen = await renderInRouter(() => (
      <RepositoryStatus name="pypi-mirror" />
    ));

    await expect
      .element(screen.getByText("Loading the remote"))
      .toBeInTheDocument();
    await expect.element(screen.getByText("None")).not.toBeInTheDocument();
    await expect
      .element(screen.getByText("Never synced"))
      .not.toBeInTheDocument();
    await expect
      .element(
        screen.getByText(
          "No distribution points at this repository: warning status;",
        ),
      )
      .not.toBeInTheDocument();
  });

  it("shows a forbidden fact as forbidden and keeps the rest", async () => {
    mockQuery(useRemoteDetailQuery, { error: forbidden, data: undefined });
    const screen = await renderInRouter(() => (
      <RepositoryStatus name="pypi-mirror" />
    ));

    await expect
      .element(
        screen.getByRole("heading", {
          name: "Danger alert:You don't have permission to read the remote",
        }),
      )
      .toBeVisible();
    await expect.element(screen.getByText("Never synced")).toBeVisible();
  });

  it("says when no repository has the name", async () => {
    mockQuery(useRepositoriesListQuery, { data: { count: 0, results: [] } });
    const screen = await renderInRouter(() => <RepositoryStatus name="nope" />);

    await expect
      .element(
        screen.getByRole("heading", { name: 'No repository is named "nope"' }),
      )
      .toBeVisible();
  });
});

import type React from "react";

import { useFrontendTool } from "@copilotkit/react-core/v2";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AxiosError, AxiosHeaders } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "vitest-browser-react";

import { distributionsListQueryOptions } from "@app/queries/distributions";
import { publicationsListQueryOptions } from "@app/queries/publications";
import { remoteDetailQueryOptions } from "@app/queries/remotes";
import {
  repositoriesListQueryOptions,
  repositoryVersionDetailQueryOptions,
  repositoryVersionsListQueryOptions,
} from "@app/queries/repositories";
import { tasksListQueryOptions } from "@app/queries/tasks";

import { useRepositoryStatusTool } from "./useRepositoryStatusTool";

vi.mock(import("@copilotkit/react-core/v2"), async (importOriginal) => ({
  ...(await importOriginal()),
  useFrontendTool: vi.fn(),
}));
vi.mock(import("@app/queries/repositories"), async (importOriginal) => ({
  ...(await importOriginal()),
  repositoriesListQueryOptions: vi.fn(),
  repositoryVersionDetailQueryOptions: vi.fn(),
  repositoryVersionsListQueryOptions: vi.fn(),
}));
vi.mock(import("@app/queries/tasks"), async (importOriginal) => ({
  ...(await importOriginal()),
  tasksListQueryOptions: vi.fn(),
}));
vi.mock(import("@app/queries/publications"), async (importOriginal) => ({
  ...(await importOriginal()),
  publicationsListQueryOptions: vi.fn(),
}));
vi.mock(import("@app/queries/distributions"), async (importOriginal) => ({
  ...(await importOriginal()),
  distributionsListQueryOptions: vi.fn(),
}));
vi.mock(import("@app/queries/remotes"), async (importOriginal) => ({
  ...(await importOriginal()),
  remoteDetailQueryOptions: vi.fn(),
}));
vi.mock(import("@app/hooks/useSelectedDomain"), () => ({
  useSelectedDomain: () => ({ enabled: false, name: "default" }),
}));

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

/** Points a mocked query factory at canned data, or a failure. */
const answer = (factory: unknown, result: unknown) =>
  vi.mocked(factory as () => unknown).mockReturnValue({
    queryKey: [String(factory), Math.random()],
    queryFn: () =>
      result instanceof Error
        ? Promise.reject(result)
        : Promise.resolve(result),
  });

const runHandler = async (args: object) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  await renderHook(() => useRepositoryStatusTool(), { wrapper });
  const tool = vi.mocked(useFrontendTool).mock.lastCall?.[0];
  return tool?.handler?.(args as never, {} as never);
};

const REPOSITORY_HREF =
  "/pulp/default/api/v3/repositories/python/python/0193-r/";

beforeEach(() => {
  answer(repositoriesListQueryOptions, {
    count: 1,
    results: [
      {
        name: "pypi-mirror",
        pulp_href: REPOSITORY_HREF,
        prn: "prn:python.pythonrepository:0193-r",
        latest_version_href: `${REPOSITORY_HREF}versions/2/`,
        remote: "/pulp/default/api/v3/remotes/python/python/0193-m/",
      },
    ],
  });
  answer(repositoryVersionDetailQueryOptions, {
    number: 2,
    content_summary: {
      added: { "python.python": { count: 3 } },
      removed: {},
      present: {
        "python.python": { count: 40 },
        "core.publishedmetadata": { count: 0 },
      },
    },
  });
  answer(repositoryVersionsListQueryOptions, { count: 3, results: [] });
  answer(tasksListQueryOptions, { count: 0, results: [] });
  answer(publicationsListQueryOptions, { count: 0, results: [] });
  answer(distributionsListQueryOptions, { count: 0, results: [] });
  answer(remoteDetailQueryOptions, {
    name: "pypi",
    url: "https://pypi.org/",
    policy: "on_demand",
    proxy_url: "http://user:secret@proxy.example.com:3128",
    tls_validation: true,
  });
});

describe("showRepositoryStatus", () => {
  it("summarizes the repository without the proxy URL", async () => {
    const summary = await runHandler({ name: "pypi-mirror" });

    expect(summary).toEqual({
      type: "python.python",
      latestVersion: {
        number: 2,
        contentCounts: { "python.python": 40 },
        added: 3,
        removed: 0,
      },
      versions: 3,
      retainRepoVersions: undefined,
      lastSync: "never synced",
      publications: 0,
      remote: {
        name: "pypi",
        url: "https://pypi.org/",
        policy: "on_demand",
        tlsValidation: true,
      },
      distributionsServingIt: [],
    });
  });

  it("keeps the rest when one side read is forbidden", async () => {
    answer(remoteDetailQueryOptions, forbidden);
    const summary = await runHandler({ name: "pypi-mirror" });

    expect(summary).toMatchObject({
      remote: { unavailable: "The user isn't allowed to read it." },
      versions: 3,
      lastSync: "never synced",
    });
  });

  it("refuses when the user may not read repositories", async () => {
    answer(repositoriesListQueryOptions, forbidden);

    await expect(runHandler({ name: "pypi-mirror" })).resolves.toEqual({
      error: "The user isn't allowed to read this repository.",
    });
  });

  it("says when no repository has the name", async () => {
    answer(repositoriesListQueryOptions, { count: 0, results: [] });

    await expect(runHandler({ name: "nope" })).resolves.toEqual({
      error: 'No repository is named "nope".',
    });
  });
});

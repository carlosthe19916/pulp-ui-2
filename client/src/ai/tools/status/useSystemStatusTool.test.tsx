import type React from "react";

import { useFrontendTool } from "@copilotkit/react-core/v2";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { renderHook } from "vitest-browser-react";

import type { StatusResponse } from "@app/client";
import { statusQueryOptions } from "@app/queries/status";
import { isSuperuserQueryOptions } from "@app/queries/users";
import { workersListQueryOptions } from "@app/queries/workers";

import { useSystemStatusTool } from "./useSystemStatusTool";

vi.mock(import("@copilotkit/react-core/v2"), async (importOriginal) => ({
  ...(await importOriginal()),
  useFrontendTool: vi.fn(),
}));
vi.mock(import("@app/queries/status"), () => ({
  statusQueryOptions: {
    queryKey: ["pulp-status"],
    queryFn: vi.fn(),
    staleTime: 300_000,
  } as never,
  useStatusQuery: vi.fn(),
}));
vi.mock(import("@app/queries/users"), () => ({
  isSuperuserQueryOptions: vi.fn(),
  useIsSuperuserQuery: vi.fn(),
}));
vi.mock(import("@app/queries/workers"), () => ({
  workersListQueryOptions: vi.fn(),
  useWorkersListQuery: vi.fn(),
}));
vi.mock(import("@app/hooks/useDefaultDomain"), () => ({
  useDefaultDomain: () => ({ enabled: false, name: "default" }),
}));

const status = {
  versions: [{ component: "core", version: "3.95.3" }],
  online_workers: [{ name: "worker-1", versions: { core: "3.95.3" } }],
  online_api_apps: [],
  online_content_apps: [],
  database_connection: { connected: true },
} as unknown as StatusResponse;

const runHandler = async ({ isSuperuser }: { isSuperuser: boolean }) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  // An old reading the app cached at start-up.
  client.setQueryData(statusQueryOptions.queryKey, {
    ...status,
    online_workers: [],
  });
  vi.mocked(statusQueryOptions.queryFn as () => unknown).mockResolvedValue(
    status,
  );
  vi.mocked(isSuperuserQueryOptions).mockReturnValue({
    queryKey: ["superuser", isSuperuser],
    queryFn: () => Promise.resolve(isSuperuser),
  } as unknown as ReturnType<typeof isSuperuserQueryOptions>);
  vi.mocked(workersListQueryOptions).mockReturnValue({
    queryKey: ["workers"],
    queryFn: () => Promise.resolve({ count: 2, results: [] }),
  } as unknown as ReturnType<typeof workersListQueryOptions>);
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  await renderHook(() => useSystemStatusTool(), { wrapper });
  const tool = vi.mocked(useFrontendTool).mock.lastCall?.[0];
  return tool?.handler?.({} as never, {} as never);
};

describe("showSystemStatus", () => {
  it("reads the status fresh, not the cached copy", async () => {
    const summary = await runHandler({ isSuperuser: false });

    expect(summary).toMatchObject({
      onlineWorkers: 1,
      missingWorkers: "only superusers can see missing workers",
      versionMismatches: [],
    });
  });

  it("counts missing workers for superusers", async () => {
    const summary = await runHandler({ isSuperuser: true });

    expect(summary).toMatchObject({ missingWorkers: 2 });
  });
});

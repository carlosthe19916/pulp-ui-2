import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import type { StatusResponse } from "@app/client";
import { useStatusQuery } from "@app/queries/status";
import { useIsSuperuserQuery } from "@app/queries/users";
import { useWorkersListQuery } from "@app/queries/workers";

import { SystemStatus } from "./SystemStatus";

vi.mock(import("@app/queries/status"), () => ({ useStatusQuery: vi.fn() }));
vi.mock(import("@app/queries/users"), () => ({ useIsSuperuserQuery: vi.fn() }));
vi.mock(import("@app/queries/workers"), () => ({
  useWorkersListQuery: vi.fn(),
}));

const status = {
  versions: [
    {
      component: "core",
      version: "3.95.3",
      package: "pulpcore",
      module: "pulpcore.app",
      domain_compatible: true,
    },
  ],
  online_workers: [{ name: "worker-1", versions: { core: "3.91.1" } }],
  online_api_apps: [{ name: "api-1", versions: { core: "3.95.3" } }],
  online_content_apps: [],
  database_connection: { connected: true },
  redis_connection: { connected: false },
  storage: { total: 1000, used: 250, free: 750 },
} as unknown as StatusResponse;

const mockQueries = ({ isSuperuser }: { isSuperuser: boolean }) => {
  vi.mocked(useStatusQuery).mockReturnValue({
    data: status,
  } as unknown as ReturnType<typeof useStatusQuery>);
  vi.mocked(useIsSuperuserQuery).mockReturnValue({
    data: isSuperuser,
  } as unknown as ReturnType<typeof useIsSuperuserQuery>);
  vi.mocked(useWorkersListQuery).mockReturnValue({
    data: { count: 2, results: [] },
  } as unknown as ReturnType<typeof useWorkersListQuery>);
};

describe("SystemStatus", () => {
  it("shows each service, the storage and a version mismatch", async () => {
    mockQueries({ isSuperuser: false });
    const screen = await render(<SystemStatus />);

    await expect
      .element(screen.getByRole("heading", { name: "Pulp status" }))
      .toBeVisible();
    await expect.element(screen.getByText("Content servers")).toBeVisible();
    await expect.element(screen.getByText("250 B of 1 kB used")).toBeVisible();
    await expect
      .element(
        screen.getByText("core 3.91.1, the API has 3.95.3: warning status;"),
      )
      .toBeVisible();
    await expect
      .element(screen.getByText("Missing workers"))
      .not.toBeInTheDocument();
  });

  it("shows missing workers to superusers", async () => {
    mockQueries({ isSuperuser: true });
    const screen = await render(<SystemStatus />);

    await expect
      .element(
        screen.getByText("2 stopped sending heartbeats: warning status;"),
      )
      .toBeVisible();
  });
});

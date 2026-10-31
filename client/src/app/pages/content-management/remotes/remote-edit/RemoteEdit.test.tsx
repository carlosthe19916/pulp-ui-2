import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { useObjectPermissions } from "@app/hooks/useObjectPermissions";
import { useResourceTasks } from "@app/hooks/useResourceTasks";
import {
  useRemoteUpdateMutation,
  useSuspenseRemoteDetailQuery,
} from "@app/queries/remotes";

import { RemoteEdit } from "./RemoteEdit";

vi.mock(import("@app/hooks/useObjectPermissions"), () => ({
  useObjectPermissions: vi.fn(),
}));
vi.mock(import("@app/hooks/useNotifications"), () => ({
  useNotifications: () => ({ addNotification: vi.fn() }),
}));
vi.mock(import("@app/hooks/useResourceTasks"), () => ({
  useResourceTasks: vi.fn(),
}));
vi.mock(import("@app/queries/remotes"), () => ({
  useSuspenseRemoteDetailQuery: vi.fn(),
  useRemoteUpdateMutation: vi.fn(),
  // Read by the form kit's resource picker, which the page imports.
  useRemoteDetailQuery: vi.fn(),
  useRemotesListQuery: vi.fn(),
}));

const renderEdit = async () => {
  const rootRoute = createRootRoute({
    component: () => (
      <RemoteEdit
        pulpDomain="default"
        pulpType="file.file"
        href="/pulp/api/v3/remotes/file/file/1/"
      />
    ),
  });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  return render(<RouterProvider router={router} />);
};

const mockPage = ({
  canChange = true,
  taskCount = 0,
}: { canChange?: boolean; taskCount?: number } = {}) => {
  vi.mocked(useSuspenseRemoteDetailQuery).mockReturnValue({
    data: {
      name: "upstream",
      url: "https://example.com/",
      prn: "prn:file.fileremote:1",
    },
  } as unknown as ReturnType<typeof useSuspenseRemoteDetailQuery>);
  vi.mocked(useRemoteUpdateMutation).mockReturnValue({
    isPending: false,
    mutate: vi.fn(),
  } as unknown as ReturnType<typeof useRemoteUpdateMutation>);
  vi.mocked(useObjectPermissions).mockReturnValue({
    can: () => canChange,
    disabledProps: vi.fn(),
  });
  vi.mocked(useResourceTasks).mockReturnValue({
    getActiveCount: () => taskCount,
    getTaskKinds: () => [],
    getTasks: () =>
      taskCount
        ? [
            {
              kind: "update",
              taskHref: "/pulp/default/api/v3/tasks/9/",
              state: "running",
            },
          ]
        : [],
  });
};

describe("RemoteEdit", () => {
  it("warns that a task is running but keeps the form", async () => {
    mockPage({ taskCount: 1 });

    const screen = await renderEdit();

    await expect
      .element(screen.getByText("An update is in progress"))
      .toBeVisible();
    await expect.element(screen.getByText(/You can still save/)).toBeVisible();
    await expect
      .element(screen.getByRole("textbox", { name: "URL" }))
      .toBeVisible();
  });

  it("shows the access-denied state instead of the form without change permission", async () => {
    mockPage({ canChange: false });

    const screen = await renderEdit();

    await expect
      .element(screen.getByRole("heading", { name: "403: Access denied" }))
      .toBeVisible();
    await expect
      .element(screen.getByText(/permission to change remote "upstream"/))
      .toBeVisible();
    await expect
      .element(screen.getByRole("textbox", { name: "Name" }))
      .not.toBeInTheDocument();
  });
});

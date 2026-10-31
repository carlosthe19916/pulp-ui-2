import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import type { IRunningTask } from "@app/hooks/useRunningTask";

import { EntityEditPage } from "./EntityEditPage";

// The form kit's pickers query the API; this page's wiring doesn't need them.
vi.mock(import("@app/components/AsyncResourceSelect"), () => ({
  AsyncResourceSelect: () => null,
  AsyncResourceMultiSelect: () => null,
}));

const renderEdit = async ({
  canChange = true,
  running,
}: { canChange?: boolean; running?: IRunningTask } = {}) => {
  const rootRoute = createRootRoute({
    component: () => (
      <EntityEditPage
        entityType="remote"
        pulpType="file.file"
        editedObject={{ name: "upstream", url: "https://example.com/" }}
        name="upstream"
        canChange={canChange}
        running={running}
        listLink="Remotes"
        detailLink="upstream"
        submitError={null}
        isSubmitting={false}
        onSubmit={vi.fn()}
        onSaved={vi.fn()}
        onCancel={vi.fn()}
      />
    ),
  });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  return render(<RouterProvider router={router} />);
};

describe("EntityEditPage", () => {
  it("warns that a task is running but keeps the form", async () => {
    const screen = await renderEdit({
      running: { kind: "update", taskHref: "/pulp/default/api/v3/tasks/9/" },
    });

    await expect
      .element(screen.getByText("An update is in progress"))
      .toBeVisible();
    await expect.element(screen.getByText(/You can still save/)).toBeVisible();
    await expect
      .element(screen.getByRole("textbox", { name: "URL" }))
      .toBeVisible();
  });

  it("shows the access-denied state instead of the form without change permission", async () => {
    const screen = await renderEdit({ canChange: false });

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

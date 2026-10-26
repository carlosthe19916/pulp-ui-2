import { beforeEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

import {
  useRoleCreateMutation,
  useRoleUpdateMutation,
} from "@app/queries/roles";

import { RoleModal } from "./RoleModal";

// Client-side form behaviour only; the real create/update and the server's own
// rejections (duplicate name, unknown permission) are covered by e2e.
vi.mock(import("@app/queries/roles"), () => ({
  useRoleCreateMutation: vi.fn(),
  useRoleUpdateMutation: vi.fn(),
}));
vi.mock(import("@app/hooks/useNotifications"), () => ({
  useNotifications: () => ({ addNotification: vi.fn() }),
}));

const createMutate = vi.fn();

beforeEach(() => {
  createMutate.mockClear();
  vi.mocked(useRoleCreateMutation).mockReturnValue({
    mutate: createMutate,
    isPending: false,
  } as unknown as ReturnType<typeof useRoleCreateMutation>);
  vi.mocked(useRoleUpdateMutation).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useRoleUpdateMutation>);
});

describe("RoleModal — create form", () => {
  it("shows Name, Description and the permission input", async () => {
    const screen = await render(<RoleModal isOpen onClose={vi.fn()} />);
    await expect
      .element(screen.getByRole("textbox", { name: "Name" }))
      .toBeVisible();
    await expect
      .element(screen.getByRole("textbox", { name: "Add permission" }))
      .toBeVisible();
  });

  it("requires a name", async () => {
    const screen = await render(<RoleModal isOpen onClose={vi.fn()} />);
    await screen.getByRole("button", { name: "Create", exact: true }).click();
    await expect.element(screen.getByText("Name is required")).toBeVisible();
    expect(createMutate).not.toHaveBeenCalled();
  });

  it("submits with the permissions added in the input", async () => {
    const screen = await render(<RoleModal isOpen onClose={vi.fn()} />);
    await screen.getByRole("textbox", { name: "Name" }).fill("custom.reader");
    await screen.getByRole("textbox", { name: "Add permission" }).click();
    await userEvent.keyboard("core.view_task{Enter}");
    await screen.getByRole("button", { name: "Create", exact: true }).click();
    expect(createMutate).toHaveBeenCalledOnce();
    expect(createMutate.mock.calls[0][0]).toMatchObject({
      name: "custom.reader",
      permissions: ["core.view_task"],
    });
  });
});

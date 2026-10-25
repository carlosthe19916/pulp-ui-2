import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import {
  useGroupCreateMutation,
  useGroupUpdateMutation,
} from "@app/queries/groups";

import { GroupModal } from "./GroupModal";

// Client-side form behaviour only; the real create/update and the server's own
// rejections (duplicate name, length) are covered by e2e.
vi.mock(import("@app/queries/groups"), () => ({
  useGroupCreateMutation: vi.fn(),
  useGroupUpdateMutation: vi.fn(),
}));
vi.mock(import("@app/hooks/useNotifications"), () => ({
  useNotifications: () => ({ addNotification: vi.fn() }),
}));

const createMutate = vi.fn();

beforeEach(() => {
  createMutate.mockClear();
  vi.mocked(useGroupCreateMutation).mockReturnValue({
    mutate: createMutate,
    isPending: false,
  } as unknown as ReturnType<typeof useGroupCreateMutation>);
  vi.mocked(useGroupUpdateMutation).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useGroupUpdateMutation>);
});

describe("GroupModal — create form", () => {
  it("GRP-CRE-01 shows a single required Name field", async () => {
    const screen = await render(<GroupModal isOpen onClose={vi.fn()} />);
    await expect
      .element(screen.getByRole("textbox", { name: "Name" }))
      .toBeVisible();
  });

  it("GRP-CRE-02 requires a name", async () => {
    const screen = await render(<GroupModal isOpen onClose={vi.fn()} />);
    await screen.getByRole("button", { name: "Create", exact: true }).click();
    await expect.element(screen.getByText("Name is required")).toBeVisible();
    expect(createMutate).not.toHaveBeenCalled();
  });

  it("submits a valid name through the create mutation", async () => {
    const screen = await render(<GroupModal isOpen onClose={vi.fn()} />);
    await screen.getByRole("textbox", { name: "Name" }).fill("ops");
    await screen.getByRole("button", { name: "Create", exact: true }).click();
    expect(createMutate).toHaveBeenCalledOnce();
    expect(createMutate.mock.calls[0][0]).toMatchObject({ name: "ops" });
  });
});

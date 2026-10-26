import { beforeEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

import {
  useUserCreateMutation,
  useUserUpdateMutation,
} from "@app/queries/users";

import { UserModal } from "./UserModal";

// The create/edit form's client behaviour (fields, validation, modal lifecycle,
// submit wiring, in-form error display) is a component test; the real round-trip
// and the server's own rejections are covered by e2e. The create modal is the
// reference form for the generic create/edit modal lifecycle.
//
// Full factory (no importOriginal): the partial form hangs browser-mode RPC. The
// user form only uses these two hooks from this module.
vi.mock(import("@app/queries/users"), () => ({
  useUserCreateMutation: vi.fn(),
  useUserUpdateMutation: vi.fn(),
}));
vi.mock(import("@app/hooks/useNotifications"), () => ({
  useNotifications: () => ({ addNotification: vi.fn() }),
}));

const createMutate = vi.fn();
let pending = false;
let nextResult: "success" | "error" = "success";

beforeEach(() => {
  createMutate.mockClear();
  pending = false;
  nextResult = "success";
  vi.mocked(useUserCreateMutation).mockImplementation(
    (options) =>
      ({
        mutate: (
          vars: Record<string, unknown>,
          callOpts?: { onSuccess?: (data: unknown) => void },
        ) => {
          createMutate(vars);
          if (nextResult === "error") {
            options?.onError?.(
              { isAxiosError: true, response: { data: {} } } as never,
              vars as never,
            );
          } else {
            const data = { ...vars, pulp_href: "/u/1" };
            options?.onSuccess?.(data as never, vars as never);
            callOpts?.onSuccess?.(data);
          }
        },
        isPending: pending,
      }) as unknown as ReturnType<typeof useUserCreateMutation>,
  );
  vi.mocked(useUserUpdateMutation).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useUserUpdateMutation>);
});

const openCreate = () => render(<UserModal isOpen onClose={vi.fn()} />);
const password = (screen: Awaited<ReturnType<typeof openCreate>>) =>
  screen.getByRole("textbox", { name: "Password", exact: true });
const fillValid = async (screen: Awaited<ReturnType<typeof openCreate>>) => {
  await screen.getByRole("textbox", { name: "Username" }).fill("alice");
  await password(screen).fill("Pulp-e2e-Xk92mfz!");
};

describe("UserModal — create form", () => {
  it("shows the fields with their defaults", async () => {
    const screen = await openCreate();
    await expect
      .element(screen.getByRole("textbox", { name: "Username" }))
      .toBeVisible();
    await expect.element(password(screen)).toBeVisible();
    await expect
      .element(screen.getByRole("textbox", { name: "Email" }))
      .toBeVisible();
    await expect
      .element(screen.getByRole("checkbox", { name: "Active" }))
      .toBeChecked();
    await expect
      .element(screen.getByRole("checkbox", { name: "Staff status" }))
      .not.toBeChecked();
  });

  it("shows the title and the Create / Cancel buttons", async () => {
    const screen = await openCreate();
    await expect
      .element(screen.getByRole("heading", { name: "Create User" }))
      .toBeVisible();
    await expect
      .element(screen.getByRole("button", { name: "Create", exact: true }))
      .toBeVisible();
    await expect
      .element(screen.getByRole("button", { name: "Cancel", exact: true }))
      .toBeVisible();
  });

  it("closing with Cancel or Escape fires onClose and sends nothing", async () => {
    const onClose = vi.fn();
    const screen = await render(<UserModal isOpen onClose={onClose} />);
    await screen.getByRole("textbox", { name: "Username" }).fill("alice");
    await screen.getByRole("button", { name: "Cancel", exact: true }).click();
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
    expect(createMutate).not.toHaveBeenCalled();
  });

  it("a freshly opened create form starts empty", async () => {
    // The modal mounts its form only while open, so every open is a fresh form.
    const screen = await openCreate();
    await expect
      .element(screen.getByRole("textbox", { name: "Username" }))
      .toHaveValue("");
    await expect.element(password(screen)).toHaveValue("");
  });

  it("shows the required errors when submitted untouched", async () => {
    const screen = await openCreate();
    await screen.getByRole("button", { name: "Create", exact: true }).click();
    await expect
      .element(screen.getByText("Username is required"))
      .toBeVisible();
    await expect
      .element(screen.getByText("Password is required"))
      .toBeVisible();
    expect(createMutate).not.toHaveBeenCalled();
  });

  it("flags a short password and clears the error when fixed", async () => {
    const screen = await openCreate();
    await password(screen).fill("short");
    await expect
      .element(screen.getByText("Password must be at least 8 characters"))
      .toBeVisible();
    await password(screen).fill("Pulp-e2e-Xk92mfz!");
    await expect
      .element(screen.getByText("Password must be at least 8 characters"))
      .not.toBeInTheDocument();
  });

  it("flags a malformed email while typing", async () => {
    const screen = await openCreate();
    await screen.getByRole("textbox", { name: "Email" }).fill("not-an-email");
    await expect
      .element(screen.getByText("Invalid email address"))
      .toBeVisible();
  });

  it("submits valid values (Enter) through the create mutation", async () => {
    const screen = await openCreate();
    await fillValid(screen);
    await password(screen).click();
    await userEvent.keyboard("{Enter}");
    expect(createMutate).toHaveBeenCalledOnce();
    expect(createMutate.mock.calls[0][0]).toMatchObject({ username: "alice" });
  });

  it("disables the submit button while a save is pending", async () => {
    pending = true;
    const screen = await openCreate();
    await expect
      .element(screen.getByRole("button", { name: /Create/ }))
      .toBeDisabled();
  });

  it("shows the server's rejection in the form", async () => {
    nextResult = "error";
    const screen = await openCreate();
    await fillValid(screen);
    await screen.getByRole("button", { name: "Create", exact: true }).click();
    await expect
      .element(screen.getByRole("heading", { name: /^Danger alert:/ }))
      .toBeVisible();
  });

  it("the in-form error clears on the next submit", async () => {
    nextResult = "error";
    const onClose = vi.fn();
    const screen = await render(<UserModal isOpen onClose={onClose} />);
    await fillValid(screen);
    await screen.getByRole("button", { name: "Create", exact: true }).click();
    await expect
      .element(screen.getByRole("heading", { name: /^Danger alert:/ }))
      .toBeVisible();
    nextResult = "success";
    await screen.getByRole("button", { name: "Create", exact: true }).click();
    expect(onClose).toHaveBeenCalled();
  });

  it("reopening after a server error starts fresh", async () => {
    nextResult = "error";
    const screen = await render(<UserModal isOpen onClose={vi.fn()} />);
    await fillValid(screen);
    await screen.getByRole("button", { name: "Create", exact: true }).click();
    await expect
      .element(screen.getByRole("heading", { name: /^Danger alert:/ }))
      .toBeVisible();
    // Closing unmounts the form; reopening mounts a fresh one with no error.
    await screen.rerender(<UserModal isOpen={false} onClose={vi.fn()} />);
    await screen.rerender(<UserModal isOpen onClose={vi.fn()} />);
    await expect
      .element(screen.getByRole("heading", { name: /^Danger alert:/ }))
      .not.toBeInTheDocument();
    await expect
      .element(screen.getByRole("textbox", { name: "Username" }))
      .toHaveValue("");
  });
});

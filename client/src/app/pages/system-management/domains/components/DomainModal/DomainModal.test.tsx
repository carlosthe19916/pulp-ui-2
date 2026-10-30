import { beforeEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

import type { DomainResponse } from "@app/client";
import {
  useDomainCreateMutation,
  useDomainUpdateMutation,
} from "@app/queries/domains";

import { DomainModal } from "./DomainModal";

// The domain form's client-side validation (name pattern, per-backend required fields) is a
// component test; the real create/edit round-trips and the server's own rejections live in e2e.
// S3/Azure backends aren't installed on the dev backend, so this is the only place that proves
// their required-field rules.
//
// Full factory (no importOriginal): the partial form hangs browser-mode RPC. The domain form
// only uses these two hooks from this module.
vi.mock(import("@app/queries/domains"), () => ({
  useDomainCreateMutation: vi.fn(),
  useDomainUpdateMutation: vi.fn(),
}));
vi.mock(import("@app/hooks/useNotifications"), () => ({
  useNotifications: () => ({ addNotification: vi.fn() }),
}));

const fileSystemDomain = {
  name: "alpha",
  pulp_href: "/pulp/api/v3/domains/1/",
  storage_class: "pulpcore.app.models.storage.FileSystem",
} as DomainResponse;

const createMutate = vi.fn();
const updateMutate = vi.fn();

beforeEach(() => {
  createMutate.mockClear();
  updateMutate.mockClear();
  vi.mocked(useDomainCreateMutation).mockReturnValue({
    mutate: createMutate,
    isPending: false,
  } as unknown as ReturnType<typeof useDomainCreateMutation>);
  vi.mocked(useDomainUpdateMutation).mockReturnValue({
    mutate: updateMutate,
    isPending: false,
  } as unknown as ReturnType<typeof useDomainUpdateMutation>);
});

const openCreate = () => render(<DomainModal isOpen onClose={vi.fn()} />);
const selectBackend = (
  screen: Awaited<ReturnType<typeof openCreate>>,
  label: string,
) =>
  userEvent.selectOptions(
    screen.getByRole("combobox", { name: "Storage backend" }),
    label,
  );

describe("DomainModal — create form", () => {
  it("rejects an invalid name", async () => {
    const screen = await openCreate();
    await screen
      .getByRole("textbox", { name: "Name", exact: true })
      .fill("bad name");
    await expect
      .element(
        screen.getByText(
          "Name may only contain letters, numbers, hyphens and underscores",
        ),
      )
      .toBeVisible();
    await screen.getByRole("button", { name: "Create", exact: true }).click();
    expect(createMutate).not.toHaveBeenCalled();
  });

  it("requires the S3 fields and clears each when filled", async () => {
    const screen = await openCreate();
    await screen
      .getByRole("textbox", { name: "Name", exact: true })
      .fill("my-domain");
    await selectBackend(screen, "Amazon S3");
    await screen.getByRole("button", { name: "Create", exact: true }).click();

    await expect
      .element(screen.getByText("Bucket name is required"))
      .toBeVisible();
    await expect
      .element(screen.getByText("Access key is required"))
      .toBeVisible();
    await expect
      .element(screen.getByText("Secret key is required"))
      .toBeVisible();

    await screen
      .getByRole("textbox", { name: "Bucket name", exact: true })
      .fill("my-bucket");
    await screen
      .getByRole("textbox", { name: "Access key", exact: true })
      .fill("AKIA");
    await screen
      .getByRole("textbox", { name: "Secret key", exact: true })
      .fill("secret");
    await expect
      .element(screen.getByText("Bucket name is required"))
      .not.toBeInTheDocument();
    await expect
      .element(screen.getByText("Access key is required"))
      .not.toBeInTheDocument();
    await expect
      .element(screen.getByText("Secret key is required"))
      .not.toBeInTheDocument();
    // Submit was blocked while the fields were missing.
    expect(createMutate).not.toHaveBeenCalled();
  });

  it("requires the Azure fields", async () => {
    const screen = await openCreate();
    await screen
      .getByRole("textbox", { name: "Name", exact: true })
      .fill("my-domain");
    await selectBackend(screen, "Azure Blob");
    await screen.getByRole("button", { name: "Create", exact: true }).click();

    await expect
      .element(screen.getByText("Container is required"))
      .toBeVisible();
    await expect
      .element(screen.getByText("Account name is required"))
      .toBeVisible();
    await expect
      .element(screen.getByText("Account key is required"))
      .toBeVisible();
    expect(createMutate).not.toHaveBeenCalled();
  });
});

describe("DomainModal — edit form", () => {
  it("applies the new backend's required fields when switched", async () => {
    // Regression: switching an existing domain's backend must apply the new backend's
    // required-field rules (previously the storage fields were hidden on edit).
    const screen = await render(
      <DomainModal isOpen domain={fileSystemDomain} onClose={vi.fn()} />,
    );
    await selectBackend(screen, "Amazon S3");
    await screen.getByRole("button", { name: "Save", exact: true }).click();

    await expect
      .element(screen.getByText("Bucket name is required"))
      .toBeVisible();
    await expect
      .element(screen.getByText("Access key is required"))
      .toBeVisible();
    await expect
      .element(screen.getByText("Secret key is required"))
      .toBeVisible();
    // The switch must block the update, not submit an S3 domain with no credentials.
    expect(updateMutate).not.toHaveBeenCalled();
  });
});

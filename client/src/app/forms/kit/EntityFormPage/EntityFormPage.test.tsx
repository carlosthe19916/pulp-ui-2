import type React from "react";

import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { testForm } from "../testForm";
import { EntityFormPage } from "./EntityFormPage";

// Monaco isn't needed to test the page: a plain textarea stands in for the code editor.
vi.mock(import("../fields/CodeEditorField"), () => ({
  CodeEditorField: ({
    id,
    label,
    value,
    onChange,
  }: {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
  }) => (
    <textarea
      id={id}
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

type PageProps = React.ComponentProps<typeof EntityFormPage>;

const renderPage = async (props: Partial<PageProps> = {}) => {
  const onSubmit = vi.fn();
  const rootRoute = createRootRoute({
    component: () => (
      <EntityFormPage
        form={testForm}
        mode="create"
        breadcrumbs={null}
        resourceFilter={{}}
        submitError={null}
        isSubmitting={false}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        {...props}
      />
    ),
  });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  const screen = await render(<RouterProvider router={router} />);
  return { screen, onSubmit };
};

const entity = {
  pulp_href: "/pulp/api/v3/remotes/file/file/1/",
  name: "upstream",
  url: "https://example.com/",
  policy: "on_demand",
  tls_validation: true,
  hidden_fields: [{ name: "password", is_set: true }],
};

describe("EntityFormPage", () => {
  it("shows the title, the essentials and collapsed sections with jump links", async () => {
    const { screen } = await renderPage();
    await expect
      .element(screen.getByRole("heading", { name: "Create widget" }))
      .toBeVisible();
    await expect
      .element(screen.getByRole("textbox", { name: "Name" }))
      .toBeVisible();
    await expect
      .element(screen.getByRole("button", { name: "Authentication" }))
      .toHaveAttribute("aria-expanded", "false");
    await expect
      .element(screen.getByRole("navigation", { name: "Jump to section" }))
      .toBeVisible();
  });

  it("opens a collapsed section that holds an error after a failed submit", async () => {
    const { screen, onSubmit } = await renderPage();
    await screen.getByRole("button", { name: "Create" }).click();
    await expect.element(screen.getByText("Name is required")).toBeVisible();
    await expect
      .element(screen.getByRole("button", { name: "Authentication" }))
      .toHaveAttribute("aria-expanded", "true");
    await expect
      .element(screen.getByText("Password is required"))
      .toBeVisible();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits the create body", async () => {
    const { screen, onSubmit } = await renderPage();
    await screen.getByRole("textbox", { name: "Name" }).fill("upstream");
    await screen
      .getByRole("textbox", { name: "URL" })
      .fill("https://example.com/");
    await screen.getByRole("button", { name: "Authentication" }).click();
    await screen.getByLabelText(/^Password/).fill("s3cret");
    await screen.getByRole("button", { name: "Create" }).click();
    await expect.poll(() => onSubmit.mock.calls.length).toBe(1);
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({
      name: "upstream",
      url: "https://example.com/",
      tls_validation: true,
      password: "s3cret",
    });
  });

  it("keeps Save disabled on edit until something changes, then sends only the change", async () => {
    const { screen, onSubmit } = await renderPage({ mode: "edit", entity });
    const save = screen.getByRole("button", { name: "Save" });
    await expect.element(save).toBeDisabled();
    await screen
      .getByRole("textbox", { name: "URL" })
      .fill("https://mirror.example.com/");
    await expect.element(save).toBeEnabled();
    await save.click();
    await expect.poll(() => onSubmit.mock.calls.length).toBe(1);
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({
      url: "https://mirror.example.com/",
    });
  });

  it("opens sections holding a value on edit", async () => {
    const { screen } = await renderPage({ mode: "edit", entity });
    await expect
      .element(screen.getByRole("button", { name: "Authentication" }))
      .toHaveAttribute("aria-expanded", "true");
    await expect
      .element(screen.getByText("Set", { exact: true }))
      .toBeVisible();
  });

  it("shows the submission error at the top of the form", async () => {
    const { screen } = await renderPage({
      submitError: { title: "Failed to create widget" },
    });
    await expect
      .element(
        screen.getByRole("heading", {
          name: /^Danger alert:\s*Failed to create widget$/,
        }),
      )
      .toBeVisible();
  });
});

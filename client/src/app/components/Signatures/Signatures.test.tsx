import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { Signatures } from "./Signatures";

// Both read the API or the router; their own behaviour is covered elsewhere.
vi.mock(import("@app/components/ResourceName"), () => ({
  ResourceName: ({ href }: { href?: string | null }) => (
    <span>service {href}</span>
  ),
}));
vi.mock(import("@app/components/ResourceHrefLink"), () => ({
  ResourceHrefLink: ({ label }: { label?: string | null }) => (
    <a href="#signature">{label}</a>
  ),
}));

const FINGERPRINT = "9C3E2AC9C71A34AF5445A5CC6AB3A0278B0C480C";

describe("Signatures", () => {
  it("shows a full key's ID and grouped fingerprint, its service and its unit", async () => {
    const screen = await render(
      <Signatures
        signatures={[
          {
            key: `v4:${FINGERPRINT}`,
            signingService: "/signing-services/1/",
            href: "/content/ansible/collection_signatures/1/",
            details: { Creator: "pulp" },
          },
        ]}
      />,
    );

    await expect.element(screen.getByText("6AB3A0278B0C480C")).toBeVisible();
    await expect
      .element(
        screen.getByText("9C3E 2AC9 C71A 34AF 5445  A5CC 6AB3 A027 8B0C 480C"),
      )
      .toBeVisible();
    await expect
      .element(screen.getByText("service /signing-services/1/"))
      .toBeVisible();
    await expect.element(screen.getByText("pulp")).toBeVisible();
    await expect
      .element(screen.getByRole("link", { name: "View signature" }))
      .toBeVisible();
  });

  it("shows only the key ID when the signature carries no fingerprint", async () => {
    const screen = await render(
      <Signatures signatures={[{ key: "keyid:6AB3A0278B0C480C" }]} />,
    );

    await expect.element(screen.getByText("6AB3A0278B0C480C")).toBeVisible();
    expect(screen.getByText("Fingerprint").all()).toHaveLength(0);
    expect(screen.getByText("Signed by").all()).toHaveLength(0);
  });

  it("says where it looked when there are none", async () => {
    const screen = await render(
      <Signatures signatures={[]} emptyText="Unsigned package" />,
    );

    await expect.element(screen.getByText("Unsigned package")).toBeVisible();
  });
});

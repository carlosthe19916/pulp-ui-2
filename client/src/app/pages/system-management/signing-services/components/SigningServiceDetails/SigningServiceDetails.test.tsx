import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import type { SigningServiceResponse } from "@app/client";

import { SigningServiceDetails } from "./SigningServiceDetails";

const service: SigningServiceResponse = {
  name: "dev-signing",
  pubkey_fingerprint: "9c3e2ac9c71a34af5445a5cc6ab3a0278b0c480c",
  script: "/var/lib/pulp/sign.sh",
  public_key:
    "-----BEGIN PGP PUBLIC KEY BLOCK-----\n\nAAAA\n-----END PGP PUBLIC KEY BLOCK-----",
  prn: "prn:core.signingservice:1",
};

describe("SigningServiceDetails", () => {
  it("shows the grouped fingerprint, long key ID and script", async () => {
    const screen = await render(<SigningServiceDetails service={service} />);

    await expect
      .element(
        screen.getByText("9C3E 2AC9 C71A 34AF 5445 A5CC 6AB3 A027 8B0C 480C"),
      )
      .toBeVisible();
    await expect.element(screen.getByText("6AB3A0278B0C480C")).toBeVisible();
    await expect
      .element(screen.getByText("/var/lib/pulp/sign.sh"))
      .toBeVisible();
  });

  it("offers the public key to copy and download", async () => {
    const screen = await render(<SigningServiceDetails service={service} />);

    await expect
      .element(screen.getByRole("textbox", { name: "Public key" }))
      .toBeVisible();
    await expect
      .element(screen.getByRole("button", { name: /Download public key/ }))
      .toBeVisible();
  });
});

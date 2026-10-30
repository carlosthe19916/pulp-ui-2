import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import type { DomainResponse } from "@app/client";

import { DomainStorageDetails } from "./DomainStorageDetails";

// `storage_settings` and `hidden_fields` are write-only in the spec (absent from the generated
// `DomainResponse`) but present at runtime, so build the fixtures through a narrow cast.
const buildDomain = (over: Record<string, unknown>): DomainResponse =>
  ({ name: "d", ...over }) as unknown as DomainResponse;

describe("DomainStorageDetails", () => {
  it("renders the backend label and its non-secret settings", async () => {
    const domain = buildDomain({
      storage_class: "storages.backends.s3.S3Storage",
      storage_settings: {
        bucket_name: "my-bucket",
        region_name: "us-east-1",
      },
    });
    const screen = await render(<DomainStorageDetails domain={domain} />);

    await expect.element(screen.getByText("Amazon S3")).toBeVisible();
    await expect.element(screen.getByText("my-bucket")).toBeVisible();
    await expect.element(screen.getByText("us-east-1")).toBeVisible();
  });

  it("shows a secret as 'Set' via hidden_fields and never its value", async () => {
    const domain = buildDomain({
      storage_class: "storages.backends.s3.S3Storage",
      storage_settings: { secret_key: "SHOULD-NOT-RENDER" },
      hidden_fields: [{ name: "secret_key", is_set: true }],
    });
    const screen = await render(<DomainStorageDetails domain={domain} />);

    await expect.element(screen.getByText("Set")).toBeVisible();
    await expect
      .element(screen.getByText("SHOULD-NOT-RENDER"))
      .not.toBeInTheDocument();
  });

  it("shows an unset secret as 'Not set'", async () => {
    const domain = buildDomain({
      storage_class: "storages.backends.s3.S3Storage",
      storage_settings: {},
      hidden_fields: [{ name: "secret_key", is_set: false }],
    });
    const screen = await render(<DomainStorageDetails domain={domain} />);

    await expect.element(screen.getByText("Not set")).toBeVisible();
  });

  it("renders the filesystem location", async () => {
    const domain = buildDomain({
      storage_class: "pulpcore.app.models.storage.FileSystem",
      storage_settings: { location: "/var/lib/pulp/media/d" },
    });
    const screen = await render(<DomainStorageDetails domain={domain} />);

    await expect.element(screen.getByText("Local filesystem")).toBeVisible();
    await expect
      .element(screen.getByText("/var/lib/pulp/media/d"))
      .toBeVisible();
  });
});

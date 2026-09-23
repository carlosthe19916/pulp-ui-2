import { describe, expect, it } from "vitest";

import {
  buildStorageSettingsSchema,
  storageClassLabel,
} from "./storageBackends";

describe("buildStorageSettingsSchema", () => {
  it("requires the filesystem location", () => {
    const schema = buildStorageSettingsSchema(
      "pulpcore.app.models.storage.FileSystem",
    );
    expect(schema.isValidSync({})).toBe(false);
    expect(schema.isValidSync({ location: "/var/lib/pulp/media/x" })).toBe(
      true,
    );
  });

  it("requires the S3 bucket name, access key and secret key", () => {
    const schema = buildStorageSettingsSchema("storages.backends.s3.S3Storage");
    expect(schema.isValidSync({})).toBe(false);
    // bucket_name alone is not enough (backend also requires access_key + secret_key).
    expect(schema.isValidSync({ bucket_name: "b" })).toBe(false);
    expect(schema.isValidSync({ bucket_name: "b", access_key: "a" })).toBe(
      false,
    );
    expect(
      schema.isValidSync({
        bucket_name: "b",
        access_key: "a",
        secret_key: "s",
      }),
    ).toBe(true);
    // region/endpoint stay optional.
    expect(
      schema.isValidSync({
        bucket_name: "b",
        access_key: "a",
        secret_key: "s",
        region_name: "us-east-1",
      }),
    ).toBe(true);
  });

  it("requires all three Azure credentials", () => {
    const schema = buildStorageSettingsSchema(
      "storages.backends.azure_storage.AzureStorage",
    );
    expect(schema.isValidSync({ azure_container: "c" })).toBe(false);
    expect(
      schema.isValidSync({
        azure_container: "c",
        account_name: "n",
        account_key: "k",
      }),
    ).toBe(true);
  });
});

describe("storageClassLabel", () => {
  it("maps a known class to its friendly label", () => {
    expect(storageClassLabel("pulpcore.app.models.storage.FileSystem")).toBe(
      "Local filesystem",
    );
  });
});

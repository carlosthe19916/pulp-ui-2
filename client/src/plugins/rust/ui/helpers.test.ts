import { describe, expect, it } from "vitest";

import {
  cargoDependencyLabel,
  cargoIndexUrl,
  cargoRegistryConfig,
  cargoRegistryName,
} from "./helpers";

describe("rust helpers", () => {
  it("maps the content URL to the sparse index", () => {
    expect(
      cargoIndexUrl({
        baseUrl: "http://host:5003/pulp/content/default/crates/",
        basePath: "crates",
      }),
    ).toBe("sparse+http://host:5003/pulp/cargo/default/crates/");
  });

  it("gives no index when Pulp can't route the base path", () => {
    expect(
      cargoIndexUrl({
        baseUrl: "http://host/pulp/content/default/rust/crates/",
        basePath: "rust/crates",
      }),
    ).toBe(null);
  });

  it("gives no index for a non-default content prefix", () => {
    expect(
      cargoIndexUrl({
        baseUrl: "https://cdn.example.com/content/crates/",
        basePath: "crates",
      }),
    ).toBe(null);
  });

  it("turns any distribution name into a valid registry name", () => {
    expect(cargoRegistryName("crates")).toBe("crates");
    expect(cargoRegistryName("rust.crates internal")).toBe(
      "rust-crates-internal",
    );
    expect(cargoRegistryName("2026-crates")).toBe("pulp-2026-crates");
  });

  it("registers the index as a named registry", () => {
    expect(
      cargoRegistryConfig({
        name: "rust.crates",
        indexUrl: "sparse+http://host/pulp/cargo/crates/",
      }),
    ).toBe(
      '[registries.rust-crates]\nindex = "sparse+http://host/pulp/cargo/crates/"',
    );
  });

  it("labels dependencies with their kind and target", () => {
    expect(
      cargoDependencyLabel({ name: "serde", req: "^1", kind: "normal" }),
    ).toBe("serde ^1");
    expect(
      cargoDependencyLabel({
        name: "libc",
        req: "^0.2",
        kind: "dev",
        target: "cfg(unix)",
      }),
    ).toBe("libc ^0.2 (dev) [cfg(unix)]");
  });
});

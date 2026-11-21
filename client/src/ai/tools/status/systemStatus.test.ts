import { describe, expect, it } from "vitest";

import type { StatusResponse } from "@app/client";

import { versionMismatches } from "./systemStatus";

const status = (workerCore: string | null): StatusResponse =>
  ({
    versions: [
      {
        component: "core",
        version: "3.95.3",
        package: "pulpcore",
        module: "pulpcore.app",
        domain_compatible: true,
      },
    ],
    online_workers: [{ name: "worker-1", versions: { core: workerCore } }],
    online_api_apps: [{ name: "api-1", versions: { core: "3.95.3" } }],
    online_content_apps: [],
  }) as unknown as StatusResponse;

describe("versionMismatches", () => {
  it("is empty when every server runs the API's versions", () => {
    expect(versionMismatches(status("3.95.3"))).toEqual([]);
  });

  it("names the server on another version", () => {
    expect(versionMismatches(status("3.91.1"))).toEqual([
      {
        app: "worker-1",
        component: "core",
        expected: "3.95.3",
        actual: "3.91.1",
      },
    ]);
  });
});

import { describe, expect, it } from "vitest";

import type { IPulpDomain } from "@app/queries/utils/pulpApi";

import { containerNamespaceKeys } from "./container-namespaces";

/** True when `key` begins with every segment of `prefix` (TanStack prefix match). */
const startsWith = ({
  key,
  prefix,
}: {
  key: readonly unknown[];
  prefix: readonly unknown[];
}) => prefix.every((segment, i) => Object.is(key[i], segment));

describe("containerNamespaceKeys", () => {
  it("keeps the list query under the list folder", () => {
    const domain: IPulpDomain = { enabled: false, name: "default" };
    expect(
      startsWith({
        key: containerNamespaceKeys.listQuery(domain, { limit: 10 }),
        prefix: containerNamespaceKeys.list(),
      }),
    ).toBe(true);
  });
});

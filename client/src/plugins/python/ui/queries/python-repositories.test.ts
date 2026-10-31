import { describe, expect, it } from "vitest";

import { repositoryKeys } from "@app/queries/repositories";

import { pythonRepositoryKeys } from "./python-repositories";

/** True when `key` begins with every segment of `prefix` (TanStack prefix match). */
const startsWith = ({
  key,
  prefix,
}: {
  key: readonly unknown[];
  prefix: readonly unknown[];
}) => prefix.every((segment, i) => Object.is(key[i], segment));

describe("pythonRepositoryKeys", () => {
  it("nests its sub-resource under the repository detail folder", () => {
    const repoHref = "/pulp/api/v3/repositories/python/python/abc/";
    expect(
      startsWith({
        key: pythonRepositoryKeys.blocklistQuery(repoHref, { limit: 1 }),
        prefix: repositoryKeys.detail(repoHref),
      }),
    ).toBe(true);
  });
});

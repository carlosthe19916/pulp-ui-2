import { describe, expect, it, vi } from "vitest";
import { renderHook } from "vitest-browser-react";

import type { RepositoryResponse } from "@app/client";
import { useDistributionsListQuery } from "@app/queries/distributions";
import { usePublicationsListQuery } from "@app/queries/publications";
import { useRemoteDetailQuery } from "@app/queries/remotes";

import { useRepositoryGraphData } from "./useRepositoryGraphData";

vi.mock(import("@app/queries/distributions"), () => ({
  useDistributionsListQuery: vi.fn(),
}));
vi.mock(import("@app/queries/publications"), () => ({
  usePublicationsListQuery: vi.fn(),
}));
vi.mock(import("@app/queries/remotes"), () => ({
  useRemoteDetailQuery: vi.fn(),
}));

const REPO = "/api/pulp/default/api/v3/repositories/file/file/r1/";
const DIST = "/api/pulp/default/api/v3/distributions/file/file/d1/";

const repository: RepositoryResponse = { pulp_href: REPO, name: "repo" };
const lookupError = new Error("lookup failed");

describe("useRepositoryGraphData", () => {
  it("reports a failed lookup of the publications' distributions", async () => {
    vi.mocked(useRemoteDetailQuery).mockReturnValue({} as never);
    vi.mocked(usePublicationsListQuery).mockReturnValue({
      data: {
        count: 1,
        results: [
          {
            pulp_href: "/pub/",
            repository_version: `${REPO}versions/1/`,
            distributions: [DIST],
          },
        ],
      },
      isLoading: false,
      error: null,
    } as never);
    // Direct distributions succeed; the `pulp_href__in` lookup fails.
    vi.mocked(useDistributionsListQuery).mockImplementation(
      ({ params }) =>
        (params.pulp_href__in
          ? { data: undefined, isLoading: false, error: lookupError }
          : {
              data: { count: 0, results: [] },
              isLoading: false,
              error: null,
            }) as never,
    );

    const { result } = await renderHook(() =>
      useRepositoryGraphData({ repository, pulpType: "file.file" }),
    );

    expect(result.current.error).toBe(lookupError);
  });
});

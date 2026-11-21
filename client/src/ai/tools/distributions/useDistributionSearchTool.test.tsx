import type React from "react";

import { useFrontendTool } from "@copilotkit/react-core/v2";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { renderHook } from "vitest-browser-react";

import {
  distributionDetailQueryOptions,
  distributionsListQueryOptions,
} from "@app/queries/distributions";

import { useDistributionSearchTool } from "./useDistributionSearchTool";

vi.mock(import("@copilotkit/react-core/v2"), async (importOriginal) => ({
  ...(await importOriginal()),
  useFrontendTool: vi.fn(),
}));
vi.mock(import("@app/queries/distributions"), async (importOriginal) => ({
  ...(await importOriginal()),
  distributionsListQueryOptions: vi.fn(),
  distributionDetailQueryOptions: vi.fn(),
}));
vi.mock(import("@app/hooks/useSelectedDomain"), () => ({
  useSelectedDomain: () => ({ enabled: false, name: "default" }),
}));

const runHandler = async (args: object) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  await renderHook(() => useDistributionSearchTool(), { wrapper });
  const tool = vi.mocked(useFrontendTool).mock.lastCall?.[0];
  return tool?.handler?.(args as never, {} as never);
};

const HREF = "/pulp/default/api/v3/distributions";

describe("showDistributions", () => {
  it("says what each distribution serves", async () => {
    vi.mocked(distributionsListQueryOptions).mockReturnValue({
      queryKey: ["distributions"],
      queryFn: () =>
        Promise.resolve({
          count: 4,
          results: [
            {
              name: "rpm",
              base_path: "rpm",
              pulp_href: `${HREF}/rpm/rpm/1/`,
              repository: "/pulp/default/api/v3/repositories/rpm/rpm/1/",
            },
            {
              name: "ubi",
              base_path: "ubi",
              pulp_href: `${HREF}/container/container/2/`,
              repository_version:
                "/pulp/default/api/v3/repositories/container/container/2/versions/3/",
            },
            {
              name: "published",
              base_path: "published",
              pulp_href: `${HREF}/file/file/3/`,
            },
            {
              name: "empty",
              base_path: "empty",
              pulp_href: `${HREF}/file/file/4/`,
            },
          ],
        }),
    } as unknown as ReturnType<typeof distributionsListQueryOptions>);
    vi.mocked(distributionDetailQueryOptions).mockImplementation(
      ({ href }) =>
        ({
          queryKey: ["distribution", href],
          queryFn: () =>
            Promise.resolve({
              publication: href?.endsWith("/3/")
                ? "/pulp/default/api/v3/publications/file/file/9/"
                : null,
            }),
        }) as unknown as ReturnType<typeof distributionDetailQueryOptions>,
    );

    const summary = (await runHandler({ basePath: "" })) as {
      shown: { name: string; serves: string }[];
    };

    expect(summary.shown.map(({ name, serves }) => [name, serves])).toEqual([
      [
        "rpm",
        "the latest publication of a repository; nothing until it is published",
      ],
      ["ubi", "a fixed repository version"],
      ["published", "a publication"],
      ["empty", "nothing"],
    ]);
    expect(vi.mocked(distributionDetailQueryOptions)).toHaveBeenCalledTimes(2);
  });
});

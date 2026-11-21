import type React from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import type { DistributionResponse } from "@app/client";
import {
  useDistributionDetailQuery,
  useDistributionsListQuery,
} from "@app/queries/distributions";

import { DistributionSearchResults } from "./DistributionSearchResults";

vi.mock(import("@app/queries/distributions"), () => ({
  useDistributionsListQuery: vi.fn(),
  useDistributionDetailQuery: vi.fn(),
}));
vi.mock(import("@app/hooks/useSelectedDomain"), () => ({
  useSelectedDomain: () => ({ enabled: false, name: "default" }),
}));
// It names the repository through its own detail query.
vi.mock(import("@app/components/NamedResourceHrefLink"), () => ({
  NamedResourceHrefLink: () => <a href="#repository">rpm-base</a>,
}));

const renderInRouter = (component: React.FC) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider
        router={createRouter({
          routeTree: createRootRoute({ component }),
          history: createMemoryHistory({ initialEntries: ["/"] }),
        })}
      />
    </QueryClientProvider>,
  );

const distribution = (
  name: string,
  fields: Partial<DistributionResponse> = {},
): DistributionResponse => ({
  name,
  base_path: name,
  pulp_href: `/pulp/default/api/v3/distributions/rpm/rpm/0193-${name}/`,
  base_url: `https://pulp.example.com/pulp/content/${name}/`,
  ...fields,
});

const mockList = (results: DistributionResponse[]) =>
  vi.mocked(useDistributionsListQuery).mockReturnValue({
    isLoading: false,
    data: { count: results.length, results },
  } as unknown as ReturnType<typeof useDistributionsListQuery>);

const mockDetail = (detail?: object) =>
  vi.mocked(useDistributionDetailQuery).mockReturnValue({
    isLoading: false,
    data: detail,
  } as unknown as ReturnType<typeof useDistributionDetailQuery>);

describe("DistributionSearchResults", () => {
  it("says an rpm distribution serves its repository's latest publication", async () => {
    mockList([
      distribution("rpm-base", {
        repository: "/pulp/default/api/v3/repositories/rpm/rpm/0193-r/",
      }),
    ]);
    mockDetail();
    const screen = await renderInRouter(() => (
      <DistributionSearchResults basePath="rpm" />
    ));

    await expect
      .element(
        screen.getByRole("heading", { name: 'Distributions matching "rpm"' }),
      )
      .toBeVisible();
    await expect
      .element(screen.getByText("Latest publication of rpm-base"))
      .toBeVisible();
    expect(vi.mocked(useDistributionDetailQuery)).toHaveBeenCalledWith({
      href: null,
    });
  });

  it("says a container distribution serves its repository's latest version", async () => {
    mockList([
      distribution("ubi", {
        pulp_href:
          "/pulp/default/api/v3/distributions/container/container/0193-d/",
        repository:
          "/pulp/default/api/v3/repositories/container/container/0193-r/",
      }),
    ]);
    mockDetail();
    const screen = await renderInRouter(() => (
      <DistributionSearchResults basePath="ubi" />
    ));

    await expect
      .element(screen.getByText("Latest version of rpm-base"))
      .toBeVisible();
  });

  it("warns when a distribution serves nothing", async () => {
    mockList([distribution("empty")]);
    mockDetail({ ...distribution("empty"), publication: null });
    const screen = await renderInRouter(() => (
      <DistributionSearchResults basePath="empty" />
    ));

    await expect
      .element(
        screen.getByText(
          "Serves nothing: it has no repository, version or publication: warning status;",
        ),
      )
      .toBeVisible();
  });

  it("links the publication a distribution serves", async () => {
    mockList([distribution("published")]);
    mockDetail({
      ...distribution("published"),
      publication: "/pulp/default/api/v3/publications/rpm/rpm/0193-p/",
    });
    const screen = await renderInRouter(() => (
      <DistributionSearchResults basePath="published" />
    ));

    await expect
      .element(screen.getByRole("link", { name: "0193-p" }))
      .toBeVisible();
  });
});

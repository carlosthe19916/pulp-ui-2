import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { useRepositoriesListQuery } from "@app/queries/repositories";

import { RepositorySearchResults } from "./RepositorySearchResults";

vi.mock(import("@app/queries/repositories"), () => ({
  useRepositoriesListQuery: vi.fn(),
}));
// It reads the router; its own behaviour is covered elsewhere.
vi.mock(import("@app/components/ResourceHrefLink"), () => ({
  ResourceHrefLink: ({ label }: { label?: string | null }) => (
    <a href="#repository">{label}</a>
  ),
}));

const mockQuery = (
  result: Partial<ReturnType<typeof useRepositoriesListQuery>>,
) =>
  vi
    .mocked(useRepositoriesListQuery)
    .mockReturnValue(result as ReturnType<typeof useRepositoriesListQuery>);

const repository = (name: string) => ({
  name,
  pulp_href: `/pulp/default/api/v3/repositories/rpm/rpm/0193-${name}/`,
});

describe("RepositorySearchResults", () => {
  it("lists the matching repositories with links", async () => {
    mockQuery({
      isLoading: false,
      data: {
        count: 2,
        results: [repository("rpm-base"), repository("rpm-extras")],
      },
    });
    const screen = await render(<RepositorySearchResults name="rpm" />);

    await expect
      .element(
        screen.getByRole("heading", { name: 'Repositories matching "rpm"' }),
      )
      .toBeVisible();
    await expect
      .element(screen.getByRole("link", { name: "rpm-base" }))
      .toBeVisible();
    await expect
      .element(screen.getByRole("link", { name: "rpm-extras" }))
      .toBeVisible();
    expect(vi.mocked(useRepositoriesListQuery)).toHaveBeenCalledWith({
      params: expect.objectContaining({ name__icontains: "rpm", offset: 0 }),
    });
  });

  it("says how many it left out", async () => {
    mockQuery({
      isLoading: false,
      data: { count: 23, results: [repository("rpm-base")] },
    });
    const screen = await render(<RepositorySearchResults name="rpm" />);

    await expect
      .element(
        screen.getByText(
          "Showing 1 of 23. Ask for a more specific name to narrow it down.",
        ),
      )
      .toBeVisible();
  });

  it("says when nothing matches", async () => {
    mockQuery({ isLoading: false, data: { count: 0, results: [] } });
    const screen = await render(<RepositorySearchResults name="nope" />);

    await expect
      .element(
        screen.getByRole("heading", { name: 'No repositories match "nope"' }),
      )
      .toBeVisible();
    expect(screen.getByRole("link").all()).toHaveLength(0);
  });

  it("says when the user may not list repositories", async () => {
    mockQuery({
      isLoading: false,
      error: new AxiosError(
        "Forbidden",
        "ERR_BAD_REQUEST",
        undefined,
        undefined,
        {
          status: 403,
          statusText: "Forbidden",
          headers: {},
          config: { headers: new AxiosHeaders() },
          data: {},
        },
      ),
    });
    const screen = await render(<RepositorySearchResults name="rpm" />);

    await expect
      .element(
        screen.getByRole("heading", {
          name: "Danger alert:You don't have permission to list repositories",
        }),
      )
      .toBeVisible();
  });
});

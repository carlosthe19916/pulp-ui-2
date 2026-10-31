import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import type { DistributionResponse } from "@app/client";
import { useDistributionLabelsMutation } from "@app/queries/distributions";

import { DistributionDetailsView } from "./DistributionDetailsView";

vi.mock(import("@app/hooks/useObjectPermissions"), () => ({
  useObjectPermissions: vi.fn(() => ({
    can: () => true,
    disabledProps: () => ({}),
  })),
}));
vi.mock(import("@app/hooks/useNotifications"), () => ({
  useNotifications: () => ({ addNotification: vi.fn() }),
}));
vi.mock(import("@app/queries/distributions"), () => ({
  useDistributionLabelsMutation: vi.fn(),
}));
// These read the API; their own tests cover them.
vi.mock(import("@app/components/ContentUrlLink"), () => ({
  ContentUrlLink: () => <span>https://content.example.com/files/stable/</span>,
}));
vi.mock(import("@app/components/PluginRepositoryClientSetup"), () => ({
  PluginRepositoryClientSetup: () => <span>client setup</span>,
}));
vi.mock(import("@app/components/NamedResourceHrefLink"), () => ({
  NamedResourceHrefLink: ({ href }: { href?: string | null }) => (
    <span>{href ? "linked" : "—"}</span>
  ),
}));

const distribution = {
  pulp_href: "/pulp/api/v3/distributions/file/file/1/",
  prn: "prn:file.filedistribution:1",
  name: "stable",
  base_path: "files/stable",
  repository: "/pulp/api/v3/repositories/file/file/2/",
  content_guard: "/pulp/api/v3/contentguards/core/rbac/3/",
  hidden: false,
  pulp_labels: { env: "prod" },
} as unknown as DistributionResponse;

describe("DistributionDetailsView", () => {
  it("shows the serving facts, then the settings grouped like the form, then metadata", async () => {
    vi.mocked(useDistributionLabelsMutation).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useDistributionLabelsMutation>);

    const screen = await render(
      <DistributionDetailsView
        distribution={distribution}
        pulpType="file.file"
      />,
    );

    for (const title of ["Serving", "General", "Access", "Metadata"]) {
      await expect
        .element(screen.getByText(title, { exact: true }))
        .toBeVisible();
    }
    await expect.element(screen.getByText("Base path")).toBeVisible();
    await expect.element(screen.getByText("Content guard")).toBeVisible();
    await expect
      .element(screen.getByText("https://content.example.com/files/stable/"))
      .toBeVisible();
    // The source is in the Serving card, not repeated among the settings.
    expect(screen.getByText("Repository", { exact: true }).all()).toHaveLength(
      1,
    );
  });
});

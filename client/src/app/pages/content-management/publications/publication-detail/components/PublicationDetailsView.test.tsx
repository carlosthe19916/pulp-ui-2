import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import type { PublicationResponse } from "@app/client";

import { PublicationDetailsView } from "./PublicationDetailsView";

// Reads the API; its own usage is covered elsewhere.
vi.mock(import("@app/components/NamedResourceHrefLink"), () => ({
  NamedResourceHrefLink: ({
    kind,
    href,
  }: {
    kind: string;
    href?: string | null;
  }) => <span>{href ? `${kind} link` : "—"}</span>,
}));

const publication = {
  pulp_href: "/pulp/api/v3/publications/file/file/1/",
  prn: "prn:file.filepublication:1",
  repository: "/pulp/api/v3/repositories/file/file/2/",
  repository_version: "/pulp/api/v3/repositories/file/file/2/versions/1/",
  distributions: ["/pulp/api/v3/distributions/file/file/3/"],
  manifest: "PULP_MANIFEST",
  checkpoint: false,
} as unknown as PublicationResponse;

describe("PublicationDetailsView", () => {
  it("shows the source and serving distributions, then the form's settings, then metadata", async () => {
    const screen = await render(
      <PublicationDetailsView publication={publication} pulpType="file.file" />,
    );

    for (const title of ["Source", "Metadata"]) {
      await expect
        .element(screen.getByText(title, { exact: true }))
        .toBeVisible();
    }
    await expect.element(screen.getByText("repository link")).toBeVisible();
    await expect
      .element(screen.getByText("repositoryVersion link"))
      .toBeVisible();
    await expect.element(screen.getByText("distribution link")).toBeVisible();
    await expect
      .element(screen.getByText("Manifest file name"))
      .toBeInTheDocument();
    // The source is in the Source card, not repeated among the settings.
    expect(screen.getByText("Repository", { exact: true }).all()).toHaveLength(
      1,
    );
    // Publications have no labels.
    expect(screen.getByText("Labels", { exact: true }).all()).toHaveLength(0);
  });
});

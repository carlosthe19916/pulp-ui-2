import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { useContentGuardDetailQuery } from "@app/queries/content-guards";
import { useSigningServiceDetailQuery } from "@app/queries/signing-services";

import { ResourceName } from "./ResourceName";

vi.mock(import("@app/queries/content-guards"), () => ({
  useContentGuardDetailQuery: vi.fn(),
}));
vi.mock(import("@app/queries/signing-services"), () => ({
  useSigningServiceDetailQuery: vi.fn(),
}));

const SIGNING = "/pulp/api/v3/signing-services/1/";
const GUARD = "/pulp/default/api/v3/contentguards/core/rbac/2/";

const answer = ({ signing, guard }: { signing?: string; guard?: string }) => {
  vi.mocked(useSigningServiceDetailQuery).mockReturnValue({
    data: signing ? { name: signing } : undefined,
  } as unknown as ReturnType<typeof useSigningServiceDetailQuery>);
  vi.mocked(useContentGuardDetailQuery).mockReturnValue({
    data: guard ? { name: guard } : undefined,
  } as unknown as ReturnType<typeof useContentGuardDetailQuery>);
};

describe("ResourceName", () => {
  it("names a signing service and a content guard", async () => {
    answer({ signing: "pulp-ui-dev-signing", guard: "downloaders" });
    const signing = await render(
      <ResourceName kind="signingService" href={SIGNING} />,
    );
    await expect
      .element(signing.getByText("pulp-ui-dev-signing"))
      .toBeVisible();
    const guard = await render(
      <ResourceName kind="contentGuard" href={GUARD} />,
    );
    await expect.element(guard.getByText("downloaders")).toBeVisible();
  });

  it("asks only the query of its kind", async () => {
    answer({});
    await render(<ResourceName kind="contentGuard" href={GUARD} />);
    expect(useSigningServiceDetailQuery).toHaveBeenLastCalledWith({ href: "" });
    expect(useContentGuardDetailQuery).toHaveBeenLastCalledWith({
      href: GUARD,
    });
  });

  it("shows the href until the name loads, and a dash without one", async () => {
    answer({});
    const loading = await render(
      <ResourceName kind="contentGuard" href={GUARD} />,
    );
    await expect.element(loading.getByText(GUARD)).toBeVisible();
    const empty = await render(
      <ResourceName kind="contentGuard" href={null} />,
    );
    await expect.element(empty.getByText("—")).toBeVisible();
  });
});

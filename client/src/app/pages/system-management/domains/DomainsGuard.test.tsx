import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { useDefaultDomain } from "@app/hooks/useDefaultDomain";

import { DomainsGuard } from "./DomainsGuard";

vi.mock(import("@app/hooks/useDefaultDomain"), () => ({
  useDefaultDomain: vi.fn(),
}));
vi.mock(import("./DomainList"), () => ({
  DomainList: () => <div>DOMAIN_LIST</div>,
}));
vi.mock(import("./components/DomainsDisabledEmptyState"), () => ({
  DomainsDisabledEmptyState: () => <div>DISABLED_STATE</div>,
}));

describe("DomainsGuard", () => {
  it("renders the domain list when domains are enabled", async () => {
    vi.mocked(useDefaultDomain).mockReturnValue({
      enabled: true,
      name: "default",
    });
    const screen = await render(<DomainsGuard />);
    await expect.element(screen.getByText("DOMAIN_LIST")).toBeVisible();
    await expect
      .element(screen.getByText("DISABLED_STATE"))
      .not.toBeInTheDocument();
  });

  it("renders the disabled empty state when domains are not enabled", async () => {
    vi.mocked(useDefaultDomain).mockReturnValue({
      enabled: false,
      name: "default",
    });
    const screen = await render(<DomainsGuard />);
    await expect.element(screen.getByText("DISABLED_STATE")).toBeVisible();
    await expect
      .element(screen.getByText("DOMAIN_LIST"))
      .not.toBeInTheDocument();
  });
});

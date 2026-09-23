import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { useApiDomain } from "@app/hooks/useApiDomain";

import { DomainsGuard } from "./DomainsGuard";

vi.mock("@app/hooks/useApiDomain", () => ({ useApiDomain: vi.fn() }));
vi.mock("./DomainList", () => ({
  DomainList: () => <div>DOMAIN_LIST</div>,
}));
vi.mock("./DomainsDisabledEmptyState", () => ({
  DomainsDisabledEmptyState: () => <div>DISABLED_STATE</div>,
}));

describe("DomainsGuard", () => {
  it("renders the domain list when domains are enabled", () => {
    vi.mocked(useApiDomain).mockReturnValue({ enabled: true, name: "default" });
    const html = renderToStaticMarkup(<DomainsGuard />);
    expect(html).toContain("DOMAIN_LIST");
    expect(html).not.toContain("DISABLED_STATE");
  });

  it("renders the disabled empty state when domains are not enabled", () => {
    vi.mocked(useApiDomain).mockReturnValue({
      enabled: false,
      name: "default",
    });
    const html = renderToStaticMarkup(<DomainsGuard />);
    expect(html).toContain("DISABLED_STATE");
    expect(html).not.toContain("DOMAIN_LIST");
  });
});

import { describe, expect, it } from "vitest";

import { isPublicGalaxyUrl } from "./galaxy";

describe("isPublicGalaxyUrl", () => {
  it("recognizes the public Galaxy and its subdomains", () => {
    expect(isPublicGalaxyUrl("https://galaxy.ansible.com/api/")).toBe(true);
    expect(isPublicGalaxyUrl("https://GALAXY.ansible.com/")).toBe(true);
    expect(isPublicGalaxyUrl("https://old.galaxy.ansible.com/api/")).toBe(true);
  });

  it("rejects other hosts that only mention Galaxy", () => {
    expect(
      isPublicGalaxyUrl("https://mirror.example.com/galaxy.ansible.com/"),
    ).toBe(false);
    expect(isPublicGalaxyUrl("https://galaxy.ansible.com.example.com/")).toBe(
      false,
    );
    expect(isPublicGalaxyUrl("https://notgalaxy.ansible.com/")).toBe(false);
    expect(isPublicGalaxyUrl("galaxy.ansible.com")).toBe(false);
  });
});

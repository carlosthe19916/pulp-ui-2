import { describe, expect, it } from "vitest";

import { formatFingerprint, longKeyId } from "./publicKey";

const FINGERPRINT = "9c3e2ac9c71a34af5445a5cc6ab3a0278b0c480c";

describe("formatFingerprint", () => {
  it("groups a v4 fingerprint like gpg does", () => {
    expect(formatFingerprint(FINGERPRINT)).toBe(
      "9C3E 2AC9 C71A 34AF 5445  A5CC 6AB3 A027 8B0C 480C",
    );
  });

  it("leaves a value that isn't a hex fingerprint as is", () => {
    expect(formatFingerprint("not-a-fingerprint")).toBe("not-a-fingerprint");
  });
});

describe("longKeyId", () => {
  it("is the last 16 hex digits", () => {
    expect(longKeyId(FINGERPRINT)).toBe("6AB3A0278B0C480C");
  });

  it("is undefined for a non-hex value", () => {
    expect(longKeyId("")).toBeUndefined();
  });
});

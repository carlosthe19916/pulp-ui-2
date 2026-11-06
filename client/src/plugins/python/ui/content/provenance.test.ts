import { describe, expect, it } from "vitest";

import { readProvenance } from "./provenance";

// Trimmed from PyPI's provenance for sampleproject-4.0.0-py3-none-any.whl.
const SAMPLE = {
  version: 1,
  attestation_bundles: [
    {
      publisher: {
        kind: "GitHub",
        repository: "pypa/sampleproject",
        workflow: "release.yml",
        environment: "",
        claims: null,
      },
      attestations: [
        {
          version: 1,
          verification_material: {
            certificate: "MIIC…",
            transparency_entries: [{ logIndex: "147137144" }],
          },
          envelope: { statement: "…", signature: "…" },
        },
      ],
    },
  ],
};

describe("readProvenance", () => {
  it("reads the publisher, its repository URL and the log entries", () => {
    expect(readProvenance(SAMPLE)).toEqual([
      {
        publisher: SAMPLE.attestation_bundles[0].publisher,
        repositoryUrl: "https://github.com/pypa/sampleproject",
        attestationCount: 1,
        logEntries: [
          {
            index: "147137144",
            url: "https://search.sigstore.dev/?logIndex=147137144",
          },
        ],
      },
    ]);
  });

  it("links no repository for a publisher it doesn't know", () => {
    const [bundle] = readProvenance({
      attestation_bundles: [
        { publisher: { kind: "Other", repository: "a/b" }, attestations: [] },
      ],
    });
    expect(bundle.repositoryUrl).toBeUndefined();
    expect(bundle.logEntries).toEqual([]);
  });

  it("is empty for a missing or malformed value", () => {
    expect(readProvenance(null)).toEqual([]);
    expect(readProvenance({})).toEqual([]);
  });
});

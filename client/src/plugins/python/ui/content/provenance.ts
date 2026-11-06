interface IRawPublisher {
  kind?: string;
  repository?: string;
  workflow?: string;
  environment?: string;
}

interface IRawProvenance {
  attestation_bundles?: {
    publisher?: IRawPublisher;
    attestations?: {
      verification_material?: {
        transparency_entries?: { logIndex?: string | number }[];
      };
    }[];
  }[];
}

interface IProvenanceBundle {
  publisher: IRawPublisher;
  repositoryUrl?: string;
  attestationCount: number;
  /** Entries in Sigstore's public transparency log, one per attestation. */
  logEntries: { index: string; url: string }[];
}

const FORGES: Record<string, string> = {
  GitHub: "https://github.com/",
  GitLab: "https://gitlab.com/",
};

/** Reads the parts of a PEP 740 provenance PyPI shows: who published it and its log entries. */
export const readProvenance = (provenance: unknown): IProvenanceBundle[] =>
  ((provenance as IRawProvenance | null)?.attestation_bundles ?? []).map(
    ({ publisher = {}, attestations = [] }) => {
      const forge = publisher.kind ? FORGES[publisher.kind] : undefined;
      return {
        publisher,
        repositoryUrl:
          forge && publisher.repository
            ? `${forge}${publisher.repository}`
            : undefined,
        attestationCount: attestations.length,
        logEntries: attestations
          .flatMap(
            (attestation) =>
              attestation.verification_material?.transparency_entries ?? [],
          )
          .filter((entry) => entry.logIndex !== undefined)
          .map((entry) => {
            const index = String(entry.logIndex);
            return {
              index,
              url: `https://search.sigstore.dev/?logIndex=${encodeURIComponent(index)}`,
            };
          }),
      };
    },
  );

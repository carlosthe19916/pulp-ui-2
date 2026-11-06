import type { ContainerManifestResponse } from "@app/client";
import type { BrowseStatus } from "@app/components/BrowseShell";

/** An image index / manifest list points at one manifest per platform. */
export const isMultiArch = (
  manifest?: Pick<ContainerManifestResponse, "listed_manifests">,
) => (manifest?.listed_manifests.length ?? 0) > 0;

/** Pulp tags cosign's signature, attestation and SBOM artifacts by manifest `type`. */
const COSIGN_TYPES: Record<string, BrowseStatus> = {
  cosign_signature: "cosignSignature",
  cosign_attestation: "cosignAttestation",
  cosign_attestation_bundle: "cosignAttestation",
  cosign_sbom: "sbom",
};

export const cosignStatus = (
  manifest?: Pick<ContainerManifestResponse, "type">,
) => (manifest?.type && COSIGN_TYPES[manifest.type]) || false;

export const pullCommand = ({
  registryPath,
  tag,
}: {
  registryPath: string;
  tag: string;
}) => `podman pull ${registryPath}:${tag}`;

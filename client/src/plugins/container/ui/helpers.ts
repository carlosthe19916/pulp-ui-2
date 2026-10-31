import type { ContainerManifestResponse } from "@app/client";

/** An image index / manifest list points at one manifest per platform. */
export const isMultiArch = (
  manifest?: Pick<ContainerManifestResponse, "listed_manifests">,
) => (manifest?.listed_manifests.length ?? 0) > 0;

export const pullCommand = ({
  registryPath,
  tag,
}: {
  registryPath: string;
  tag: string;
}) => `podman pull ${registryPath}:${tag}`;

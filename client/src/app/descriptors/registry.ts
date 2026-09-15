import type { VersionResponse } from "@app/client";

import type { IResourceDescriptor, ResourceKind } from "./types";

const descriptorMap = new Map<string, IResourceDescriptor>();

/** Descriptors are keyed by kind+pulpType since the same pulp_type (e.g. "file.file") can back multiple resource kinds (repository, remote, distribution, publication, content). */
const compositeKey = (kind: ResourceKind, pulpType: string): string => {
  return `${kind}:${pulpType}`;
};

/** Register a resource descriptor in the global registry. */
export const registerDescriptor = (descriptor: IResourceDescriptor): void => {
  descriptorMap.set(
    compositeKey(descriptor.kind, descriptor.pulpType),
    descriptor,
  );
};

/** Look up a descriptor by kind + pulp_type. Returns undefined for unknown types. */
export const getDescriptor = (
  kind: ResourceKind,
  pulpType: string,
): IResourceDescriptor | undefined => {
  return descriptorMap.get(compositeKey(kind, pulpType));
};

/** Return all registered descriptors for a given resource kind. */
export const getDescriptorsForKind = (
  kind: ResourceKind,
): IResourceDescriptor[] => {
  return Array.from(descriptorMap.values()).filter((d) => d.kind === kind);
};

/** Return all registered descriptors that are available given the installed plugins. */
export const getAvailableDescriptors = (
  plugins: VersionResponse[],
): IResourceDescriptor[] => {
  return Array.from(descriptorMap.values()).filter((d) =>
    d.isAvailable(plugins),
  );
};

/** Return all registered descriptors. */
export const getAllDescriptors = (): IResourceDescriptor[] => {
  return Array.from(descriptorMap.values());
};

import type { VersionResponse } from "@app/client";

import type { IResourceDescriptor, ResourceKind } from "./types";

const descriptorMap = new Map<string, IResourceDescriptor>();

/** Keyed by kind+pulpType: one pulp_type (e.g. "file.file") can back multiple kinds. */
const compositeKey = (kind: ResourceKind, pulpType: string): string => {
  return `${kind}:${pulpType}`;
};

export const registerDescriptor = (descriptor: IResourceDescriptor): void => {
  descriptorMap.set(
    compositeKey(descriptor.kind, descriptor.pulpType),
    descriptor,
  );
};

export const getDescriptor = (
  kind: ResourceKind,
  pulpType: string,
): IResourceDescriptor | undefined => {
  return descriptorMap.get(compositeKey(kind, pulpType));
};

export const getDescriptorsForKind = (
  kind: ResourceKind,
): IResourceDescriptor[] => {
  return Array.from(descriptorMap.values()).filter((d) => d.kind === kind);
};

export const getAvailableDescriptors = (
  plugins: VersionResponse[],
): IResourceDescriptor[] => {
  return Array.from(descriptorMap.values()).filter((d) =>
    d.isAvailable(plugins),
  );
};

export const getAllDescriptors = (): IResourceDescriptor[] => {
  return Array.from(descriptorMap.values());
};

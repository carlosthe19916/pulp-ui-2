import type { VersionResponse } from "@app/client";

import type { ResourceDescriptor, ResourceKind } from "./types";

const descriptorMap = new Map<string, ResourceDescriptor>();

/** Descriptors are keyed by kind+pulpType since the same pulp_type (e.g. "file.file") can back multiple resource kinds (repository, remote, distribution, publication, content). */
function compositeKey(kind: ResourceKind, pulpType: string): string {
  return `${kind}:${pulpType}`;
}

/** Register a resource descriptor in the global registry. */
export function registerDescriptor(descriptor: ResourceDescriptor): void {
  descriptorMap.set(
    compositeKey(descriptor.kind, descriptor.pulpType),
    descriptor,
  );
}

/** Look up a descriptor by kind + pulp_type. Returns undefined for unknown types. */
export function getDescriptor(
  kind: ResourceKind,
  pulpType: string,
): ResourceDescriptor | undefined {
  return descriptorMap.get(compositeKey(kind, pulpType));
}

/** Return all registered descriptors for a given resource kind. */
export function getDescriptorsForKind(
  kind: ResourceKind,
): ResourceDescriptor[] {
  return Array.from(descriptorMap.values()).filter((d) => d.kind === kind);
}

/** Return all registered descriptors that are available given the installed plugins. */
export function getAvailableDescriptors(
  plugins: VersionResponse[],
): ResourceDescriptor[] {
  return Array.from(descriptorMap.values()).filter((d) =>
    d.isAvailable(plugins),
  );
}

/** Return all registered descriptors. */
export function getAllDescriptors(): ResourceDescriptor[] {
  return Array.from(descriptorMap.values());
}

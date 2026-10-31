import type { EntityType, IPulpType } from "@catalog";

import type { ResourceKind } from "@app/utils/entityField";

/** Per-resource-kind compatible pulp_types an `asyncResource` field offers. */
export type ResourceFilterMap = Partial<Record<ResourceKind, string[]>>;

/**
 * Compatible pulp_types for a modal's `asyncResource` pickers, mirroring the backend;
 * kinds without a restriction are absent.
 */
export const buildResourceFilter = ({
  kind,
  plugin,
}: {
  kind: EntityType;
  plugin: IPulpType | undefined;
}): ResourceFilterMap => {
  const filters: ResourceFilterMap = {};

  if (kind === "repository") {
    const compatibleRemoteTypes =
      plugin?.entities.repository?.compatibleRemoteTypes;
    if (compatibleRemoteTypes) {
      filters.remote = compatibleRemoteTypes;
    }
  }

  return filters;
};

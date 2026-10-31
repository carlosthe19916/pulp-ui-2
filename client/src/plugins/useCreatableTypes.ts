import type { ITypeOption } from "@app/forms";
import { useApiStatus } from "@app/hooks/useApiStatus";
import { type EntityType, getAvailableTypes } from "@catalog";

import { getEntityForm } from "./registry";

/** Installed types of `entity` that have a create form, in declaration order. */
export const useCreatableTypes = (entity: EntityType): ITypeOption[] => {
  const installed = useApiStatus().plugins;
  return getAvailableTypes({ entity, installed }).flatMap((plugin) => {
    const entry = getEntityForm({
      entity,
      pulpType: plugin.pulpType,
      mode: "create",
    });
    return entry ? [{ pulpType: plugin.pulpType, label: entry.label }] : [];
  });
};

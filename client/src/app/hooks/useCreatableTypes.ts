import type { ITypeOption } from "@app/forms";
import { useApiStatus } from "@app/hooks/useApiStatus";
import { type EntityType, getAvailableTypes } from "@catalog";
import { getEntityForm } from "@plugins";

/** Installed types of `entity` that have a create form, in declaration order. */
export const useCreatableTypes = (entity: EntityType): ITypeOption[] => {
  const installed = useApiStatus().plugins;
  return getAvailableTypes({ entity, installed }).flatMap(({ pulpType }) => {
    const entry = getEntityForm({ entity, pulpType, mode: "create" });
    return entry ? [{ pulpType, label: entry.label }] : [];
  });
};

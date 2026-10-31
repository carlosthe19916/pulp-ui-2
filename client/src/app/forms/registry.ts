import { useApiStatus } from "@app/hooks/useApiStatus";
import { type EntityType, getAvailablePlugins, type PulpType } from "@catalog";

import { DISTRIBUTION_FORMS } from "./distributions";
import type { ITypeOption } from "./kit/EntityFormPage";
import type { FormMode, IFormDef } from "./kit/types";
import { PUBLICATION_FORMS } from "./publications";
import { REMOTE_FORMS } from "./remotes";
import { REPOSITORY_FORMS } from "./repositories";

/** A plugin's form for one entity and the modes it supports (push repositories: edit only). */
export interface IFormEntry {
  /** The type's name in the Type select, e.g. "Ansible collection". */
  label: string;
  form: IFormDef;
  modes: FormMode[];
}

export type FormRegistry = Record<PulpType, IFormEntry>;

/**
 * Per-plugin forms by entity and pulp_type. Unlike the other per-type registries there is
 * no generic fallback: a type without a form can't be created or edited (ADR 0009).
 */
const FORMS_BY_ENTITY: Record<EntityType, FormRegistry> = {
  remote: REMOTE_FORMS,
  repository: REPOSITORY_FORMS,
  distribution: DISTRIBUTION_FORMS,
  publication: PUBLICATION_FORMS,
};

export const getEntityForm = ({
  entity,
  pulpType,
  mode,
}: {
  entity: EntityType;
  pulpType: string;
  mode: FormMode;
}): IFormEntry | undefined => {
  const entry = FORMS_BY_ENTITY[entity][pulpType];
  return entry?.modes.includes(mode) ? entry : undefined;
};

/** Installed types of `entity` that have a create form, in catalog order. */
export const useCreatableTypes = (entity: EntityType): ITypeOption[] => {
  const installed = useApiStatus().plugins;
  return getAvailablePlugins({ entity, installed }).flatMap((plugin) => {
    const entry = getEntityForm({
      entity,
      pulpType: plugin.pulpType,
      mode: "create",
    });
    return entry ? [{ pulpType: plugin.pulpType, label: entry.label }] : [];
  });
};

/** Every registered entity and pulp_type (tests check them against the catalog). */
export const registeredEntries = (): {
  entity: EntityType;
  pulpType: PulpType;
}[] =>
  (Object.keys(FORMS_BY_ENTITY) as EntityType[]).flatMap((entity) =>
    Object.keys(FORMS_BY_ENTITY[entity]).map((pulpType) => ({
      entity,
      pulpType,
    })),
  );

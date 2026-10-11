/**
 * The resolution engine: turns the authored `IPluginDefinition`s into the resolved,
 * pulp_type-keyed catalog (`buildCatalog`). `whenInstalled` is the availability
 * helper that `plugins/*.ts` use to declare `app.isAvailable`.
 */

import type { VersionResponse } from "@app/client";

import type {
  EntityType,
  IContributionBase,
  IEntitySlot,
  IEntityVariant,
  IPlugin,
  IPluginDefinition,
  IPluginEntity,
  IPluginRepositoryEntity,
  IRepositoryContribution,
  PluginCatalog,
  PulpType,
} from "./types";

/** Availability check: true when any of the given component/package ids is installed. */
export const whenInstalled =
  (...ids: string[]) =>
  (installedPlugins: VersionResponse[]) =>
    installedPlugins.some(
      (plugin) =>
        ids.includes(plugin.component ?? "") ||
        ids.includes(plugin.package ?? ""),
    );

/** Recursively freeze a value so the assembled catalog is read-only at runtime. */
const deepFreeze = <T>(value: T): T => {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
};

/** Normalize an entity slot to its contribution array (single, variant, or array). */
const slotContributions = <T extends IContributionBase>(
  slot: IEntitySlot<T> | undefined,
): Array<T | IEntityVariant<T>> =>
  Array.isArray(slot) ? slot : slot ? [slot] : [];

/** Mutable accumulator: repository entries narrow to `IPluginRepositoryEntity` at runtime. */
type MutablePlugin = {
  pulpType: PulpType;
  label: string;
  isAvailable: IPlugin["isAvailable"];
  entities: Partial<Record<EntityType, IPluginEntity>>;
};

/**
 * Assemble the authored definitions into the resolved catalog, keyed by pulp_type.
 * Each contribution resolves its identity (plugin defaults overridden by a variant's
 * `ui`/`rest`); contributions sharing a pulp_type (its default plus the entities it
 * fills) merge into one `IPlugin`, so every `entities` slot is a single contribution.
 * Returns a deeply-frozen catalog and throws on a duplicate `(pulp_type, entity)`.
 */
export const buildCatalog = (
  definitions: IPluginDefinition[],
): PluginCatalog => {
  const catalog: Record<PulpType, MutablePlugin> = {};
  for (const def of definitions) {
    for (const entity of Object.keys(def.entities) as EntityType[]) {
      const slot = def.entities[entity] as
        IEntitySlot<IContributionBase> | undefined;
      for (const contribution of slotContributions(slot)) {
        const variantRest = "rest" in contribution ? contribution.rest : {};
        const variantUi = "ui" in contribution ? contribution.ui : {};
        const pulpType = variantRest.pulpType ?? def.rest.pulpType;
        const apiPath = variantRest.apiPath ?? def.rest.apiPath;
        const label = variantUi.label ?? def.ui.label;

        const plugin = (catalog[pulpType] ??= {
          pulpType,
          label,
          isAvailable: def.app.isAvailable,
          entities: {},
        });
        if (plugin.entities[entity]) {
          throw new Error(
            `Duplicate catalog entry for ${entity} "${pulpType}".`,
          );
        }

        const resolved: IPluginEntity = {
          apiPath,
          form: {
            isWizard: contribution.form.isWizard,
            createFields: [...contribution.form.createFields],
            editFields: [...contribution.form.editFields],
          },
        };
        if (entity === "repository") {
          const repo = contribution as
            IRepositoryContribution | IEntityVariant<IRepositoryContribution>;
          const repoEntity: IPluginRepositoryEntity = {
            ...resolved,
            compatibleRemoteTypes: [...repo.compatibleRemoteTypes],
            compatiblePublicationTypes: [...repo.compatiblePublicationTypes],
          };
          plugin.entities.repository = repoEntity;
        } else {
          plugin.entities[entity] = resolved;
        }
      }
    }
  }
  return deepFreeze(catalog) as PluginCatalog;
};

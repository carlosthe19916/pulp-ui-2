/**
 * The resolution engine: turns the authored `IPluginDefinition`s into the resolved,
 * pulp_type-keyed catalog (`buildCatalog`). `whenInstalled` is the availability
 * helper that `plugins/*.ts` use to declare `app.isAvailable`.
 */

import type { VersionResponse } from "@app/client";

import type {
  EntityType,
  IContentType,
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
  isAvailable: IPlugin["isAvailable"];
  entities: Partial<Record<EntityType, IPluginEntity>>;
  content?: IContentType[];
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
  // Content pulp_types/apiPaths are NOT catalog keys, so the per-entity duplicate
  // check below doesn't cover them; guard their global uniqueness independently.
  const seenContentTypes = new Set<PulpType>();
  const seenContentApiPaths = new Set<string>();
  for (const def of definitions) {
    for (const entity of Object.keys(def.entities) as EntityType[]) {
      const slot = def.entities[entity] as
        IEntitySlot<IContributionBase> | undefined;
      for (const contribution of slotContributions(slot)) {
        const variantRest = "rest" in contribution ? contribution.rest : {};
        const pulpType = variantRest.pulpType ?? def.rest.pulpType;
        const apiPath = variantRest.apiPath ?? def.rest.apiPath;

        const plugin = (catalog[pulpType] ??= {
          pulpType,
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
            contentChanges: repo.contentChanges,
            archiveImport: repo.archiveImport,
            contentTypes: (def.content ?? []).map((ct) => ct.pulpType),
          };
          plugin.entities.repository = repoEntity;
        } else {
          plugin.entities[entity] = resolved;
        }
      }
    }

    // Content types attach to the plugin under its own pulp_type (a content-only
    // def like `core` still gets a plugin entry with empty `entities`).
    if (def.content?.length) {
      const plugin = (catalog[def.rest.pulpType] ??= {
        pulpType: def.rest.pulpType,
        isAvailable: def.app.isAvailable,
        entities: {},
      });
      for (const ct of def.content) {
        if (seenContentTypes.has(ct.pulpType)) {
          throw new Error(`Duplicate content type pulp_type "${ct.pulpType}".`);
        }
        seenContentTypes.add(ct.pulpType);
        if (ct.apiPath) {
          if (seenContentApiPaths.has(ct.apiPath)) {
            throw new Error(`Duplicate content apiPath "${ct.apiPath}".`);
          }
          seenContentApiPaths.add(ct.apiPath);
        }
      }
      plugin.content = [...(plugin.content ?? []), ...def.content];
    }
  }
  return deepFreeze(catalog) as PluginCatalog;
};

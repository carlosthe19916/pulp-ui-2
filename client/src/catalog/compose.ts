import type { VersionResponse } from "@app/client";

import type { IEntityField } from "./field-types";
import type {
  EntityCatalog,
  EntityType,
  IEntityContribution,
  IEntityPlugin,
  IPluginCapabilities,
  IPluginDefinition,
  PluginEntityMap,
} from "./types";
import { ENTITY_TYPES } from "./types";

/** Availability check: true when any of the given component/package ids is installed. */
export const whenInstalled =
  (...ids: string[]) =>
  (installedPlugins: VersionResponse[]) =>
    installedPlugins.some(
      (plugin) =>
        ids.includes(plugin.component ?? "") ||
        ids.includes(plugin.package ?? ""),
    );

/** Capability baseline: nothing but creation; plugins opt into the rest. */
const DEFAULT_CAPABILITIES: IPluginCapabilities = {
  creatable: true,
  sync: false,
  publish: false,
  upload: false,
};

/** Copy a field list so the resolved catalog never aliases a shared base array. */
const copyFields = (fields?: IEntityField[]): IEntityField[] =>
  fields ? [...fields] : [];

/** Recursively freeze a value so the assembled catalog is read-only at runtime. */
const deepFreeze = <T>(value: T): T => {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
};

/** Resolve one contribution into an `IEntityPlugin`: plugin defaults + overrides. */
const composeEntityPlugin = (
  defaults: Pick<IPluginDefinition, "app" | "ui" | "rest">,
  contribution: IEntityContribution,
): IEntityPlugin => ({
  rest: { ...defaults.rest, ...contribution.rest },
  ui: { ...defaults.ui, ...contribution.ui },
  app: defaults.app,
  form: {
    isWizard: contribution.isWizard ?? false,
    createFields: copyFields(contribution.form?.createFields),
    editFields: copyFields(contribution.form?.editFields),
  },
  page: {
    detailFields: copyFields(contribution.page?.detailFields),
    browseCardFields: copyFields(contribution.page?.browseCardFields),
    browseDetailFields: copyFields(contribution.page?.browseDetailFields),
  },
  capabilities: { ...DEFAULT_CAPABILITIES, ...contribution.capabilities },
});

/** Define a plugin (the sole extension point): resolve each entity slot it fills. */
export const definePlugin = (
  definition: IPluginDefinition,
): PluginEntityMap => {
  const plugins: PluginEntityMap = {};
  for (const entity of Object.keys(definition.entities) as EntityType[]) {
    const slot = definition.entities[entity];
    const contributions = Array.isArray(slot) ? slot : slot ? [slot] : [];
    plugins[entity] = contributions.map((contribution) =>
      composeEntityPlugin(definition, contribution),
    );
  }
  return plugins;
};

/**
 * Assemble plugins into the catalog tree. Returns a deeply-frozen (read-only)
 * catalog and throws on a duplicate (entity, pulp_type) — pulp_type keys are
 * runtime strings the type system can't dedupe.
 */
export const buildCatalog = (plugins: PluginEntityMap[]): EntityCatalog => {
  const catalog = Object.fromEntries(
    ENTITY_TYPES.map((entity) => [entity, {}]),
  ) as EntityCatalog;
  for (const plugin of plugins) {
    for (const entity of Object.keys(plugin) as EntityType[]) {
      for (const entityPlugin of plugin[entity] ?? []) {
        const { pulpType } = entityPlugin.rest;
        if (catalog[entity][pulpType]) {
          throw new Error(
            `Duplicate catalog entry for ${entity} "${pulpType}".`,
          );
        }
        catalog[entity][pulpType] = entityPlugin;
      }
    }
  }
  return deepFreeze(catalog);
};

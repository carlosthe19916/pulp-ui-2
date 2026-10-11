/**
 * Public surface of the catalog (import via `@catalog`). Global-scoped data: any
 * feature can read Pulp's entity types and plugins without reaching into `@app`.
 * To add a plugin: a file under `plugins/` (exporting an `IPluginDefinition`) + an
 * entry in the `pluginDefinitions` array below.
 */

import type { VersionResponse } from "@app/client";

import { buildCatalog } from "./compose";
import { container } from "./plugins/container";
import { file } from "./plugins/file";
import { gem } from "./plugins/gem";
import { huggingFace } from "./plugins/hugging-face";
import { maven } from "./plugins/maven";
import { npm } from "./plugins/npm";
import { python } from "./plugins/python";
import { rpm } from "./plugins/rpm";
import { ENTITY_TYPE_LABELS, ENTITY_TYPES } from "./types";
import type { EntityType, IPlugin, IPluginDefinition, PulpType } from "./types";

/** All plugin definitions, in display order. Add a new plugin here. */
const pluginDefinitions: IPluginDefinition[] = [
  file,
  rpm,
  python,
  container,
  gem,
  npm,
  maven,
  huggingFace,
];

/** The assembled catalog: pulp_type → the plugin resolved for that pulp_type. */
const catalog = buildCatalog(pluginDefinitions);

/**
 * Reverse index: entity type → `apiPath` (the `<app>/<slug>` collection segment
 * carried in every resource `pulp_href`) → pulp_type. `apiPath` is unique within an
 * entity, so this is a collision-free bijection.
 */
const apiPathIndex = Object.fromEntries(
  ENTITY_TYPES.map((entity) => [entity, {}]),
) as Record<EntityType, Record<string, PulpType>>;
for (const plugin of Object.values(catalog)) {
  for (const entity of Object.keys(plugin.entities) as EntityType[]) {
    const entityPlugin = plugin.entities[entity];
    if (entityPlugin)
      apiPathIndex[entity][entityPlugin.apiPath] = plugin.pulpType;
  }
}

/** Safe lookup — the plugin resolved for a pulp_type, or `undefined` if unknown. */
export const getPlugin = (pulpType: PulpType): IPlugin | undefined =>
  catalog[pulpType];

/** Plugins implementing `entity` whose package is installed in this environment. */
export const getAvailablePlugins = (
  entity: EntityType,
  installed: VersionResponse[],
): IPlugin[] =>
  Object.values(catalog).filter(
    (plugin) => plugin.entities[entity] && plugin.isAvailable(installed),
  );

/**
 * Resolve a pulp_type from an entity + its `apiPath` (the `<app>/<slug>` segment of
 * a resource href). Returns `undefined` for an unmodelled plugin.
 */
export const resolvePulpTypeByApiPath = (
  entity: EntityType,
  apiPath: string,
): PulpType | undefined => apiPathIndex[entity][apiPath];

/** Human-readable singular label for an entity type (UI titles, toasts). */
export const getEntityLabel = (entity: EntityType): string =>
  ENTITY_TYPE_LABELS[entity];

export type {
  EntityType,
  IPlugin,
  IPluginEntity,
  IPluginForm,
  IPluginRepositoryEntity,
  PulpType,
} from "./types";
export type { IEntityField } from "./field-types";

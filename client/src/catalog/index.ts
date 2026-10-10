/**
 * Public surface of the catalog (import via `@catalog`). Global-scoped data: any
 * feature can read Pulp's entity types and plugins without reaching into `@app`.
 * To add a plugin: a file under `plugins/` + an entry in the `plugins` array below.
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
import type { EntityType, IEntityPlugin, PulpType } from "./types";

/** All plugins, in display order. Add a new plugin here. */
const plugins = [file, rpm, python, container, gem, npm, maven, huggingFace];

/** The assembled catalog: entity type → pulp_type → resolved plugin. */
export const catalog = buildCatalog(plugins);

/**
 * Reverse index of the catalog: entity type → `rest.apiPath` → pulp_type. Built
 * from the same resolved plugins, so it needs no separate maintenance. `apiPath`
 * (the `<app>/<slug>` collection segment carried in every resource `pulp_href`)
 * is unique within an entity, so this is a collision-free bijection.
 */
const apiPathIndex: Record<
  EntityType,
  Record<string, PulpType>
> = Object.fromEntries(
  ENTITY_TYPES.map((entity) => [
    entity,
    Object.fromEntries(
      Object.values(catalog[entity]).map((plugin) => [
        plugin.rest.apiPath,
        plugin.rest.pulpType,
      ]),
    ),
  ]),
) as Record<EntityType, Record<string, PulpType>>;

/** Safe lookup — returns `undefined` for an unknown/uninstalled pulp_type. */
export const getEntityPlugin = (
  entity: EntityType,
  pulpType: PulpType,
): IEntityPlugin | undefined => catalog[entity][pulpType];

/**
 * Resolve a pulp_type from an entity + its `rest.apiPath` (the `<app>/<slug>`
 * segment of a resource href). Returns `undefined` for an unmodelled plugin.
 */
export const resolvePulpTypeByApiPath = (
  entity: EntityType,
  apiPath: string,
): PulpType | undefined => apiPathIndex[entity][apiPath];

/** All plugins for an entity type, keyed by pulp_type. */
export const getPlugins = (
  entity: EntityType,
): Record<PulpType, IEntityPlugin> => catalog[entity];

/** Plugins for an entity type whose package is installed in this environment. */
export const getAvailablePlugins = (
  entity: EntityType,
  installed: VersionResponse[],
): IEntityPlugin[] =>
  Object.values(catalog[entity]).filter((plugin) =>
    plugin.app.isAvailable(installed),
  );

/** Human-readable singular label for an entity type (UI titles, toasts). */
export const getEntityLabel = (entity: EntityType): string =>
  ENTITY_TYPE_LABELS[entity];

export { definePlugin, whenInstalled } from "./compose";

export { ENTITY_TYPES, ENTITY_TYPE_LABELS } from "./types";
export type {
  EntityCatalog,
  EntityType,
  IContributionBase,
  IEntityPlugin,
  IEntityVariant,
  IPluginApp,
  IPluginDefinition,
  IPluginForm,
  IPluginRest,
  IPluginUi,
  IRepositoryContribution,
  PluginEntityMap,
  PulpType,
} from "./types";
export type { IEntityField, IFieldOption, FieldType } from "./field-types";

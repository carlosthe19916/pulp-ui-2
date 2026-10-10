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
import type { EntityType, IEntityPlugin, PulpType } from "./types";

/** All plugins, in display order. Add a new plugin here. */
const plugins = [file, rpm, python, container, gem, npm, maven, huggingFace];

/** The assembled catalog: entity type → pulp_type → resolved plugin. */
export const catalog = buildCatalog(plugins);

/** Safe lookup — returns `undefined` for an unknown/uninstalled pulp_type. */
export const getPlugin = (
  entity: EntityType,
  pulpType: PulpType,
): IEntityPlugin | undefined => catalog[entity][pulpType];

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

/** Installed plugins for an entity type that can be created (for create menus). */
export const getCreatablePlugins = (
  entity: EntityType,
  installed: VersionResponse[],
): IEntityPlugin[] =>
  getAvailablePlugins(entity, installed).filter(
    (plugin) => plugin.capabilities.creatable,
  );

export { definePlugin, whenInstalled } from "./compose";

export { ENTITY_TYPES } from "./types";
export type {
  EntityCatalog,
  EntityType,
  IEntityContribution,
  IEntityPlugin,
  IPluginApp,
  IPluginCapabilities,
  IPluginDefinition,
  IPluginForm,
  IPluginPage,
  IPluginRest,
  IPluginUi,
  PluginEntityMap,
  PulpType,
} from "./types";
export type { IEntityField, IFieldOption, FieldType } from "./field-types";

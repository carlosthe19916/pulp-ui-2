/**
 * Public surface of the catalog (import via `@catalog`). Global-scoped data: any
 * feature can read Pulp's entity types and plugins without reaching into `@app`.
 * To add a plugin: a file under `plugins/` (exporting an `IPluginDefinition`) + an
 * entry in the `pluginDefinitions` array below.
 */

import type { VersionResponse } from "@app/client";

import { remoteBase } from "./base-fields";
import { buildCatalog } from "./compose";
import type { IEntityField } from "./field-types";
import { ansible } from "./plugins/ansible";
import { container } from "./plugins/container";
import { core } from "./plugins/core";
import { deb } from "./plugins/deb";
import { file } from "./plugins/file";
import { gem } from "./plugins/gem";
import { huggingFace } from "./plugins/hugging-face";
import { maven } from "./plugins/maven";
import { npm } from "./plugins/npm";
import { ostree } from "./plugins/ostree";
import { python } from "./plugins/python";
import { rpm } from "./plugins/rpm";
import { ENTITY_TYPE_LABELS, ENTITY_TYPES } from "./types";
import type {
  EntityType,
  IContentType,
  IPlugin,
  IPluginDefinition,
  PulpType,
} from "./types";

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
  ostree,
  deb,
  ansible,
  core,
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

/**
 * Content-type indexes. Content types are not catalog keys (a plugin owns many), so
 * they get their own by-pulp_type and by-apiPath maps. The owning plugin is tracked
 * for installed-awareness. Endpoint-less types (no `apiPath`) stay out of the path
 * index (they can't be browsed/filtered) but remain resolvable by pulp_type.
 */
const contentTypeByPulpType: Record<PulpType, IContentType> = {};
const contentTypeByApiPath: Record<string, PulpType> = {};
for (const plugin of Object.values(catalog)) {
  for (const ct of plugin.content ?? []) {
    contentTypeByPulpType[ct.pulpType] = ct;
    if (ct.apiPath) contentTypeByApiPath[ct.apiPath] = ct.pulpType;
  }
}

/** Safe lookup — the plugin resolved for a pulp_type, or `undefined` if unknown. */
export const getPlugin = (pulpType: PulpType): IPlugin | undefined =>
  catalog[pulpType];

/** The content type for a content pulp_type, or `undefined` if not modelled. */
export const getContentType = (pulpType: PulpType): IContentType | undefined =>
  contentTypeByPulpType[pulpType];

/** Content types across all plugins (optionally only those whose package is installed). */
export const getContentTypes = ({
  installed,
}: {
  installed?: VersionResponse[];
} = {}): IContentType[] =>
  Object.values(catalog).flatMap((plugin) =>
    !installed || plugin.isAvailable(installed) ? (plugin.content ?? []) : [],
  );

/** Resolve a content pulp_type from its `<app>/<slug>` collection apiPath. */
export const resolveContentTypeByApiPath = ({
  apiPath,
}: {
  apiPath: string;
}): PulpType | undefined => contentTypeByApiPath[apiPath];

/**
 * Remote edit fields for a pulp_type, falling back to the shared pulpcore base when
 * the plugin (or its remote slot) isn't modelled, so any remote still shows its
 * standard fields.
 */
export const getRemoteEditFields = (pulpType: PulpType): IEntityField[] =>
  getPlugin(pulpType)?.entities.remote?.form.editFields ?? remoteBase.edit;

/** Plugins implementing `entity` whose package is installed in this environment. */
export const getAvailablePlugins = ({
  entity,
  installed,
}: {
  entity: EntityType;
  installed: VersionResponse[];
}): IPlugin[] =>
  Object.values(catalog).filter(
    (plugin) => plugin.entities[entity] && plugin.isAvailable(installed),
  );

/**
 * Resolve a pulp_type from an entity + its `apiPath` (the `<app>/<slug>` segment of
 * a resource href). Returns `undefined` for an unmodelled plugin.
 */
export const resolvePulpTypeByApiPath = ({
  entity,
  apiPath,
}: {
  entity: EntityType;
  apiPath: string;
}): PulpType | undefined => apiPathIndex[entity][apiPath];

/** Human-readable singular label for an entity type (UI titles, toasts). */
export const getEntityLabel = (entity: EntityType): string =>
  ENTITY_TYPE_LABELS[entity];

export type {
  ContentUploadMechanism,
  EntityType,
  IContentDetail,
  IContentType,
  IContentUpload,
  IPlugin,
  IPluginEntity,
  IPluginForm,
  IPluginRepositoryEntity,
  PulpType,
} from "./types";
export type { IEntityField } from "./field-types";

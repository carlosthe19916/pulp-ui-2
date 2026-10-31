/**
 * The pure plugin registry (`@catalog`): every plugin's definition, and the lookups over them.
 * No UI is imported, so queries and href helpers can read it. To add a plugin, add its
 * definition here; `@plugins` then requires its UI.
 */
import {
  createCatalog,
  type IPluginDefinition,
  type TypesOf,
} from "@plugin-sdk/definition";

import { ansible } from "./ansible/definition";
import { container } from "./container/definition";
import { core } from "./core/definition";
import { deb } from "./deb/definition";
import { file } from "./file/definition";
import { gem } from "./gem/definition";
import { huggingFace } from "./hugging_face/definition";
import { maven } from "./maven/definition";
import { npm } from "./npm/definition";
import { ostree } from "./ostree/definition";
import { python } from "./python/definition";
import { rpm } from "./rpm/definition";

/** Every plugin's definition, in display order. */
export const PLUGIN_DEFINITIONS = [
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
] as const;

type Definition = (typeof PLUGIN_DEFINITIONS)[number];

/** A plugin's id, e.g. "rpm". */
export type PluginId = Definition["id"];
/** The definition of the plugin with id `I`. */
export type DefinitionOf<I extends PluginId> = Extract<Definition, { id: I }>;

type AllTypesOf<
  S extends
    "remote" | "repository" | "distribution" | "publication" | "content",
> = Definition extends infer D
  ? D extends IPluginDefinition
    ? TypesOf<D, S>
    : never
  : never;

export type RemoteType = AllTypesOf<"remote">;
export type RepositoryType = AllTypesOf<"repository">;
export type DistributionType = AllTypesOf<"distribution">;
export type PublicationType = AllTypesOf<"publication">;
export type ContentType = AllTypesOf<"content">;

type ContentApiPathOf<K extends string> = Definition extends infer D
  ? D extends { content: { [Q in K]: { apiPath: infer P } } }
    ? P
    : never
  : never;

/** Content types that have a list endpoint, mapped to its apiPath. */
export type ContentTypeApiPaths = {
  [
    K in ContentType as [ContentApiPathOf<K>] extends [never] ? never : K
  ]: ContentApiPathOf<K>;
};

export const {
  getAcsSources,
  getAvailableTypes,
  getContentType,
  getContentTypes,
  getPulpType,
  getRepositoryContentTypes,
  getRepositoryTypesForContent,
  getRepositoryTypesForPublication,
  getScannableRepositoryTypes,
  isPluginInstalled,
  resolveContentTypeByApiPath,
  resolvePulpTypeByApiPath,
} = createCatalog(PLUGIN_DEFINITIONS);

export {
  type ContentUploadMechanism,
  ENTITY_TYPES,
  type EntityType,
  type IContentType,
  type IPulpType,
  type IPulpTypeEntity,
  type IPulpTypeRepository,
  type IRepositoryAction,
  type PulpType,
} from "@plugin-sdk/definition";

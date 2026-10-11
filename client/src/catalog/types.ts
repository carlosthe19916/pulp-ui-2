import type { VersionResponse } from "@app/client";

import type { IEntityField } from "./field-types";

/**
 * Data model for Pulp's content entity types and the plugins implementing them.
 * Two ingredients compose: `base-fields.ts` (shared field groups) and `plugins/*.ts`
 * (one per plugin); `index.ts` assembles them into the catalog, keyed by pulp_type.
 * Data only.
 */

/** The five content entity types Pulp exposes — the static, closed backbone. */
export const ENTITY_TYPES = [
  "repository",
  "remote",
  "distribution",
  "publication",
  "content",
] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];

/** Human-readable singular label for each entity type (UI titles, toasts). */
export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  repository: "Repository",
  remote: "Remote",
  distribution: "Distribution",
  publication: "Publication",
  content: "Content",
};

/** A Pulp type identifier, e.g. "file.file" or "rpm.uln". */
export type PulpType = string;

/** UI concern: the label shown for the plugin (e.g. in the create type selector). */
export interface IPluginUi {
  label: string;
}

/** App-environment concern: whether the plugin's package is installed. */
export interface IPluginApp {
  isAvailable: (installedPlugins: VersionResponse[]) => boolean;
}

/** REST concern: the plugin's pulp_type and its collection sub-path. */
export interface IPluginRest {
  pulpType: PulpType;
  apiPath: string;
}

/** Create/edit field lists (base + plugin extras) plus the wizard flag. */
export interface IPluginForm {
  isWizard: boolean;
  createFields: IEntityField[];
  editFields: IEntityField[];
}

// --- Resolved shapes (what `index.ts` exposes; keyed by pulp_type) ---

/** One entity's resolved contribution for a pulp_type: its endpoint and form. */
export interface IPluginEntity {
  /** The `<app>/<slug>` collection segment, per entity (content pluralizes). */
  apiPath: string;
  form: IPluginForm;
}

/**
 * A repository's resolved contribution additionally carries the pulp_types it can
 * sync from (`compatibleRemoteTypes`, the backend's `REMOTE_TYPES`) and publish to
 * (`compatiblePublicationTypes`). `[]` when it can't sync/publish.
 */
export interface IPluginRepositoryEntity extends IPluginEntity {
  compatibleRemoteTypes: PulpType[];
  compatiblePublicationTypes: PulpType[];
}

/**
 * A plugin resolved for a single pulp_type: its identity plus the entity types it
 * implements. Variants (a second pulp_type for one entity, e.g. `file.git`) resolve
 * to their own `IPlugin`, so every `entities` slot is a single contribution — which
 * makes `plugin.entities.repository?.compatibleRemoteTypes` a direct read.
 */
export interface IPlugin {
  pulpType: PulpType;
  label: string;
  isAvailable: (installedPlugins: VersionResponse[]) => boolean;
  entities: {
    repository?: IPluginRepositoryEntity;
    remote?: IPluginEntity;
    distribution?: IPluginEntity;
    publication?: IPluginEntity;
    content?: IPluginEntity;
  };
}

// --- Authored shapes (what a `plugins/*.ts` file writes) ---

/**
 * What every entity slot provides. No identity (`ui`/`rest`) — that comes from the
 * plugin defaults, overridden only by variants (see `IEntityVariant`). Every field
 * is required and explicit.
 */
export interface IContributionBase {
  form: {
    isWizard: boolean;
    createFields: IEntityField[];
    editFields: IEntityField[];
  };
}

/**
 * A repository slot additionally declares the pulp_types it can be associated with:
 * `compatibleRemoteTypes` (sync sources, the backend's `REMOTE_TYPES`) and
 * `compatiblePublicationTypes` (publish targets). `[]` when it can't sync/publish.
 * Only repositories carry these — other entities never need them.
 */
export interface IRepositoryContribution extends IContributionBase {
  compatibleRemoteTypes: PulpType[];
  compatiblePublicationTypes: PulpType[];
}

/**
 * A variant slot — a second pulp_type for one entity (e.g. `file.git`, `rpm.uln`,
 * `python.pypi`, container pull-through, file content's `file/files`). It overrides
 * the plugin's identity; non-variant slots inherit the plugin defaults.
 */
export type IEntityVariant<T extends IContributionBase> = T & {
  ui: Partial<IPluginUi>;
  rest: Partial<IPluginRest>;
};

/** One entity slot: a primary contribution and/or variants (array for both). */
export type IEntitySlot<T extends IContributionBase> =
  T | IEntityVariant<T> | Array<T | IEntityVariant<T>>;

/**
 * A plugin: its `app`/`ui`/`rest` identity once, then the entities it implements.
 * `ui`/`rest` are the defaults for every slot; a variant slot overrides them. Only
 * `repository` slots carry remote/publication type lists.
 */
export interface IPluginDefinition {
  app: IPluginApp;
  ui: IPluginUi;
  rest: IPluginRest;
  entities: {
    repository?: IEntitySlot<IRepositoryContribution>;
    remote?: IEntitySlot<IContributionBase>;
    distribution?: IEntitySlot<IContributionBase>;
    publication?: IEntitySlot<IContributionBase>;
    content?: IEntitySlot<IContributionBase>;
  };
}

/** The assembled catalog: pulp_type → the plugin resolved for that pulp_type. */
export type PluginCatalog = Record<PulpType, IPlugin>;

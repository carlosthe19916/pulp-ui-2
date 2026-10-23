import type { VersionResponse } from "@app/client";

import type { IEntityField } from "./field-types";

/**
 * Data model for Pulp's content entity types and the plugins implementing them.
 * Two ingredients compose: `base-fields.ts` (shared field groups) and `plugins/*.ts`
 * (one per plugin); `index.ts` assembles them into the catalog, keyed by pulp_type.
 * Data only.
 */

/**
 * The mutable CRUD entity types Pulp exposes — the static, closed backbone. Content
 * is deliberately NOT here: it is immutable (no create/edit form) and a single
 * plugin owns many content types, so it is modelled separately as `IContentType`.
 */
export const ENTITY_TYPES = [
  "repository",
  "remote",
  "distribution",
  "publication",
] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];

/** Human-readable singular label for each entity type (UI titles, toasts). */
export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  repository: "Repository",
  remote: "Remote",
  distribution: "Distribution",
  publication: "Publication",
};

/** A Pulp type identifier, e.g. "file.file" or "rpm.uln". */
export type PulpType = string;

// --- Content types (immutable, many-per-plugin; NOT a CRUD entity) ---

/**
 * How a content unit is uploaded: `upload` posts the file to the synchronous
 * `<apiPath>/upload/` (201 + the content); `create` posts it to `<apiPath>/`
 * (202 + a task whose `created_resources` holds the content).
 */
export type ContentUploadMechanism = "upload" | "create";

/** Upload capability of an uploadable content type. Absent ⇒ read-only (sync/push only). */
export interface IContentUpload {
  mechanism: ContentUploadMechanism;
  fields: IEntityField[];
}

/** Optional detail-page field layout for a content type (drawer). */
export interface IContentDetail {
  fields: IEntityField[];
}

/**
 * One content type owned by a plugin. Identity is always present; capabilities are
 * optional and phase-populated. Content is IMMUTABLE — no create/edit field lists.
 * `pulpType` is NOT a catalog key (a plugin owns many content types); `apiPath` is
 * the `<app>/<slug>` collection segment, omitted for endpoint-less types.
 */
export interface IContentType {
  pulpType: PulpType;
  apiPath?: string;
  uploadable?: IContentUpload;
  detail?: IContentDetail;
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
 * (`compatiblePublicationTypes`). `[]` when it can't sync/publish. `contentTypes`
 * are the content pulp_types its plugin owns (also for variants).
 */
export interface IPluginRepositoryEntity extends IPluginEntity {
  compatibleRemoteTypes: PulpType[];
  compatiblePublicationTypes: PulpType[];
  contentChanges: IRepositoryContribution["contentChanges"];
  archiveImport: boolean;
  contentTypes: PulpType[];
}

/**
 * A plugin resolved for a single pulp_type: its identity plus the entity types it
 * implements. Variants (a second pulp_type for one entity, e.g. `file.git`) resolve
 * to their own `IPlugin`, so every `entities` slot is a single contribution — which
 * makes `plugin.entities.repository?.compatibleRemoteTypes` a direct read.
 */
export interface IPlugin {
  pulpType: PulpType;
  isAvailable: (installedPlugins: VersionResponse[]) => boolean;
  entities: {
    repository?: IPluginRepositoryEntity;
    remote?: IPluginEntity;
    distribution?: IPluginEntity;
    publication?: IPluginEntity;
  };
  /** Content types this plugin owns (immutable; separate from CRUD `entities`). */
  content?: IContentType[];
}

// --- Authored shapes (what a `plugins/*.ts` file writes) ---

/**
 * What every entity slot provides. No identity (`rest`) — that comes from the plugin
 * defaults, overridden only by variants (see `IEntityVariant`). Every field is
 * required and explicit.
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
  /**
   * How content is added/removed: `modify` (one `modify/` call) or `addRemove`
   * (container's `add/` and `remove/`); `null` when it can't be (container push).
   */
  contentChanges: "modify" | "addRemove" | null;
  /** Imports an uploaded archive into a new version (OSTree `import_all/`). */
  archiveImport: boolean;
}

/**
 * A variant slot — a second pulp_type for one entity (e.g. `file.git`, `rpm.uln`,
 * `python.pypi`, container pull-through). It overrides the plugin's REST identity;
 * non-variant slots inherit the plugin defaults.
 */
export type IEntityVariant<T extends IContributionBase> = T & {
  rest: Partial<IPluginRest>;
};

/** One entity slot: a primary contribution and/or variants (array for both). */
export type IEntitySlot<T extends IContributionBase> =
  T | IEntityVariant<T> | Array<T | IEntityVariant<T>>;

/**
 * A plugin: its `app`/`rest` identity once, then the entities it implements. `rest`
 * is the default for every slot; a variant slot overrides it. Only `repository`
 * slots carry remote/publication type lists.
 */
export interface IPluginDefinition {
  app: IPluginApp;
  rest: IPluginRest;
  entities: {
    repository?: IEntitySlot<IRepositoryContribution>;
    remote?: IEntitySlot<IContributionBase>;
    distribution?: IEntitySlot<IContributionBase>;
    publication?: IEntitySlot<IContributionBase>;
  };
  /** Content types this plugin owns (immutable; separate from CRUD `entities`). */
  content?: IContentType[];
}

/** The assembled catalog: pulp_type → the plugin resolved for that pulp_type. */
export type PluginCatalog = Record<PulpType, IPlugin>;

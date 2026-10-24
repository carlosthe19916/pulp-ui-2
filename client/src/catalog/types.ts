import type { VersionResponse } from "@app/client";

import type { IEntityField } from "./fieldTypes";

/**
 * Data model for Pulp's content entity types and the plugins implementing them.
 * Two ingredients compose: `base-fields.ts` (shared field groups) and `plugins/*.ts`
 * (one per plugin); `index.ts` assembles them into the catalog, keyed by pulp_type.
 * Data only.
 */

/**
 * The mutable CRUD entity types. Content isn't here: it is immutable and one plugin owns
 * many content types (see `IContentType`).
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
 * How a content unit is uploaded: `upload` to the synchronous `<apiPath>/upload/` (201 +
 * content), or `create` to `<apiPath>/` (202 + task).
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
 * One content type owned by a plugin (immutable: no form fields). `apiPath` is its
 * `<app>/<slug>` segment, omitted for endpoint-less types.
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
 * A repository's resolved contribution, adding the pulp_types it syncs from / publishes to
 * (`[]` when it can't) and its plugin's content types.
 */
export interface IPluginRepositoryEntity extends IPluginEntity {
  compatibleRemoteTypes: PulpType[];
  compatiblePublicationTypes: PulpType[];
  contentChanges: IRepositoryContribution["contentChanges"];
  archiveImport: boolean;
  actions: IRepositoryAction[];
  contentTypes: PulpType[];
}

/**
 * A plugin resolved for one pulp_type. A variant (e.g. `file.git`) resolves to its own
 * `IPlugin`, so each `entities` slot is one contribution.
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
 * What every entity slot provides. Identity (`rest`) comes from the plugin defaults,
 * overridden only by variants.
 */
export interface IContributionBase {
  form: {
    isWizard: boolean;
    createFields: IEntityField[];
    editFields: IEntityField[];
  };
}

/**
 * A repository slot also declares the pulp_types it syncs from (`compatibleRemoteTypes`,
 * backend `REMOTE_TYPES`) and publishes to; `[]` when it can't.
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
  /** Plugin-specific actions (sign, tag, copy…); none when absent. */
  actions?: IRepositoryAction[];
}

/**
 * A plugin action: a POST that starts a task, with a form built from `fields`.
 */
export interface IRepositoryAction {
  key: string;
  label: string;
  /**
   * Relative to the target's href (`sign/`), or a collection endpoint when it
   * starts with `/` (`/rpm/copy/`).
   */
  path: string;
  target: "repository" | "version";
  fields: IEntityField[];
  description?: string;
  /**
   * For collection endpoints: the body field the repository href fills (`list`
   * sends it as a one-item list).
   */
  repositoryParam?: { key: string; list?: boolean };
}

/**
 * A variant slot: a second pulp_type for one entity (e.g. `file.git`, `rpm.uln`) that
 * overrides the plugin's REST identity.
 */
export type IEntityVariant<T extends IContributionBase> = T & {
  rest: Partial<IPluginRest>;
};

/** One entity slot: a primary contribution and/or variants (array for both). */
export type IEntitySlot<T extends IContributionBase> =
  T | IEntityVariant<T> | Array<T | IEntityVariant<T>>;

/**
 * A plugin: its `app`/`rest` identity once (the default for every slot), then the
 * entities it implements.
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

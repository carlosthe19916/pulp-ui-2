import type { VersionResponse } from "@app/client";

import type { IEntityField } from "./field-types";

/**
 * Data model for Pulp's content entity types and the plugins implementing them.
 * Two ingredients compose: `base-fields.ts` (shared field groups) and `plugins/*.ts`
 * (one per plugin); `index.ts` assembles them into the `catalog` tree. Data only.
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

/** Form concern (resolved): entity base fields + plugin extras, and wizard flag. */
export interface IPluginForm {
  isWizard: boolean;
  createFields: IEntityField[];
  editFields: IEntityField[];
}

/** A plugin's resolved implementation of one entity type (e.g. the File remote). */
export interface IEntityPlugin {
  rest: IPluginRest;
  ui: IPluginUi;
  app: IPluginApp;
  form: IPluginForm;
  /**
   * Remote pulp_types this repository can sync from (the backend's `REMOTE_TYPES`).
   * Empty for non-repository entities and for repositories that can't sync.
   */
  compatibleRemoteTypes: PulpType[];
  /**
   * Publication pulp_types this repository can be published to (one per plugin
   * that exposes a publication endpoint; e.g. a python repository → `python.pypi`).
   * Empty for non-repository entities and for repositories that can't publish.
   */
  compatiblePublicationTypes: PulpType[];
}

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

/** Union of every contribution shape — the input `composeEntityPlugin` resolves. */
export type IAnyContribution =
  | IContributionBase
  | IRepositoryContribution
  | IEntityVariant<IContributionBase>
  | IEntityVariant<IRepositoryContribution>;

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

/** Return of `definePlugin`: entity type → that plugin's resolved plugins. */
export type PluginEntityMap = Partial<Record<EntityType, IEntityPlugin[]>>;

/** The assembled tree: entity type → (pulp_type → resolved plugin). */
export type EntityCatalog = Record<EntityType, Record<PulpType, IEntityPlugin>>;

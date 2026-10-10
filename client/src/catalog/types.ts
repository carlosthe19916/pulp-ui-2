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

/** Page concern (resolved): fields shown on detail and browse surfaces. */
export interface IPluginPage {
  detailFields: IEntityField[];
  browseCardFields: IEntityField[];
  browseDetailFields: IEntityField[];
}

/** Capabilities concern: which actions a plugin type supports. */
export interface IPluginCapabilities {
  creatable: boolean;
  sync: boolean;
  publish: boolean;
  upload: boolean;
}

/** A plugin's resolved implementation of one entity type (e.g. the File remote). */
export interface IEntityPlugin {
  rest: IPluginRest;
  ui: IPluginUi;
  app: IPluginApp;
  form: IPluginForm;
  page: IPluginPage;
  capabilities: IPluginCapabilities;
}

/**
 * One plugin's input for one entity (one variant). `form`/`page` are the per-entity
 * fields; `isWizard`/`capabilities` fall back to defaults; `ui`/`rest` override the
 * plugin defaults only for variants (e.g. ULN's label, PyPI's pulp_type).
 */
export interface IEntityContribution {
  ui?: Partial<IPluginUi>;
  rest?: Partial<IPluginRest>;
  isWizard?: boolean;
  form?: {
    createFields?: IEntityField[];
    editFields?: IEntityField[];
  };
  page?: Partial<IPluginPage>;
  capabilities?: Partial<IPluginCapabilities>;
}

/**
 * A plugin: its `app`/`ui`/`rest` concerns once, then the entities it implements.
 * `app` never varies by entity; `ui`/`rest` are overridable defaults. A slot is an
 * array when a plugin has variant pulp_types (e.g. rpm's `rpm.rpm` + `rpm.uln`).
 */
export interface IPluginDefinition {
  app: IPluginApp;
  ui: IPluginUi;
  rest: IPluginRest;
  entities: Partial<
    Record<EntityType, IEntityContribution | IEntityContribution[]>
  >;
}

/** Return of `definePlugin`: entity type → that plugin's resolved plugins. */
export type PluginEntityMap = Partial<Record<EntityType, IEntityPlugin[]>>;

/** The assembled tree: entity type → (pulp_type → resolved plugin). */
export type EntityCatalog = Record<EntityType, Record<PulpType, IEntityPlugin>>;

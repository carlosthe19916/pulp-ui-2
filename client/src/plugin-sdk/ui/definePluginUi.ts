import type React from "react";

import type { ContentEndpoints } from "@app/client/pulpTypes.gen";
import type { FormMode, IFormDef, IFormFor } from "@app/plugin-forms";
import type { IEntityField } from "@app/utils/entityField";

import type {
  EntityType,
  IEndpointsByEntity,
  IPluginDefinition,
  TypesOf,
} from "../definition";
import type {
  ClientSetup,
  IActionUi,
  IArchiveImportUi,
  IContentPanelProps,
  IContentSearch,
  ICreateFromUi,
  INavPage,
  IPluginBrowse,
  IRepositoryTab,
} from "./contracts";
import type { FormBody } from "./forms";

/** Use the host's generic view for this piece (panel, Browse, client setup). */
export const GENERIC: unique symbol = Symbol("generic");
export type Generic = typeof GENERIC;

/** The UI of one remote, distribution or publication type. */
export interface ITypeUi<F extends IFormDef = IFormDef> {
  /** The name in the Type select; defaults to the plugin's label. */
  label?: string;
  form: F;
}

/**
 * The form a type's slot takes: the one built for its collection (`remoteForm(def)`), so another
 * type's form doesn't fit. Any form when read through the widened shape (`T` is `string`).
 */
type SlotForm<
  E extends EntityType,
  D extends IPluginDefinition,
  T extends string,
> = string extends T
  ? IFormDef
  : IFormFor<FormBody<E, SlotApiPath<E, D, T>>, `${E}:${SlotApiPath<E, D, T>}`>;

type SlotApiPath<
  E extends EntityType,
  D extends IPluginDefinition,
  T extends string,
> = NonNullable<D[E]>[T]["apiPath"] & keyof IEndpointsByEntity[E] & string;

type RemoteDefOf<D extends IPluginDefinition, T extends string> = NonNullable<
  D["remote"]
>[T];

/** Each declared create-from endpoint needs its UI; a type without one declares none. */
type CreateFromUi<A> =
  A extends Readonly<Record<string, unknown>>
    ? { createFrom: { [K in keyof A]: ICreateFromUi } }
    : { createFrom?: never };

export type IRemoteTypeUi<
  D extends IPluginDefinition,
  T extends string,
> = ITypeUi<SlotForm<"remote", D, T>> &
  CreateFromUi<RemoteDefOf<D, T>["createFrom"]>;

type RepositoryDefOf<
  D extends IPluginDefinition,
  T extends string,
> = NonNullable<D["repository"]>[T];

/** An archive-importing repository needs its import UI; any other can't have one. */
type ArchiveImportUi<A> = A extends true
  ? { archiveImport: IArchiveImportUi }
  : { archiveImport?: never };

/** Each declared action needs its label and fields; a type without actions declares none. */
type ActionsUi<A> =
  A extends Readonly<Record<string, unknown>>
    ? { actions: { [K in keyof A]: IActionUi } }
    : { actions?: never };

export type IRepositoryTypeUi<
  D extends IPluginDefinition,
  T extends string,
> = ITypeUi<SlotForm<"repository", D, T>> & {
  /** `["edit"]` for types Pulp creates itself (container push). */
  modes?: readonly FormMode[];
  browse: IPluginBrowse<TypesOf<D, "content">> | Generic;
  /** The plugin's own repository tab, or `null` for none. */
  tab: IRepositoryTab | null;
} & ActionsUi<RepositoryDefOf<D, T>["actions"]> &
  ArchiveImportUi<RepositoryDefOf<D, T>["archiveImport"]>;

/** A content guard type's UI: its name, what it allows, and its modal form's fields. */
export interface IContentGuardTypeUi {
  label: string;
  description: string;
  fields: IEntityField[];
}

export type IDistributionTypeUi<
  D extends IPluginDefinition = IPluginDefinition,
  T extends string = string,
> = ITypeUi<SlotForm<"distribution", D, T>> & {
  clientSetup: ClientSetup | Generic;
};

type ListParams<P> = P extends keyof ContentEndpoints
  ? keyof NonNullable<ContentEndpoints[P]["list"]["query"]> & string
  : never;

type ContentDefOf<D extends IPluginDefinition, T extends string> = NonNullable<
  D["content"]
>[T];

/**
 * One content type's UI. `search` must be a real filter of its list endpoint; an uploadable
 * type needs its upload fields and a read-only one can't have any.
 */
export type IContentTypeUi<D extends IPluginDefinition, T extends string> = {
  panel: React.ComponentType<IContentPanelProps> | Generic;
  search: IContentSearch<ListParams<ContentDefOf<D, T>["apiPath"]>> | null;
} & (ContentDefOf<D, T> extends { upload: string }
  ? { upload: IEntityField[] }
  : { upload?: never });

interface IUiSections<D extends IPluginDefinition> {
  remote: { [T in TypesOf<D, "remote">]: IRemoteTypeUi<D, T> };
  repository: { [T in TypesOf<D, "repository">]: IRepositoryTypeUi<D, T> };
  distribution: {
    [T in TypesOf<D, "distribution">]: IDistributionTypeUi<D, T>;
  };
  publication: {
    [T in TypesOf<D, "publication">]: ITypeUi<SlotForm<"publication", D, T>>;
  };
  content: { [T in TypesOf<D, "content">]: IContentTypeUi<D, T> };
  contentGuard: { [T in TypesOf<D, "contentGuard">]: IContentGuardTypeUi };
}

/** An ACS's name, only when the definition declares one; it defaults to the plugin's label. */
type AcsUi<D extends IPluginDefinition> = D extends { acs: object }
  ? { acs?: { label?: string } }
  : { acs?: never };

/**
 * A plugin's UI, its shape derived from its definition: a section per section the definition
 * has, and an entry per pulp_type it declares. A missing or extra type fails to compile.
 */
export type PluginUi<D extends IPluginDefinition> = {
  /** The plugin's name; the default label of its types. */
  label: string;
  pages?: readonly INavPage[];
} & {
  [
    S in keyof IUiSections<D> as S extends keyof D ? S : never
  ]: IUiSections<D>[S];
} & AcsUi<D>;

/** Any plugin's UI read through one shape: what the registry walks once checked per plugin. */
export interface IAnyPluginUi {
  label: string;
  pages?: readonly INavPage[];
  remote?: Readonly<Record<string, IRemoteTypeUi<IPluginDefinition, string>>>;
  repository?: Readonly<
    Record<string, IRepositoryTypeUi<IPluginDefinition, string>>
  >;
  distribution?: Readonly<Record<string, IDistributionTypeUi>>;
  publication?: Readonly<Record<string, ITypeUi>>;
  content?: Readonly<Record<string, IContentTypeUi<IPluginDefinition, string>>>;
  acs?: { label?: string };
  contentGuard?: Readonly<Record<string, IContentGuardTypeUi>>;
}

/** A plugin's checked UI under its plugin's id, the unit the UI registry holds. */
export interface IPluginModule<I extends string = string> {
  id: I;
  ui: IAnyPluginUi;
}

/** Declares a plugin's UI against its definition; the UI's shape is checked here. */
export const definePluginUi = <D extends IPluginDefinition>({
  definition,
  ui,
}: {
  definition: D;
  ui: PluginUi<D>;
}): IPluginModule<D["id"]> => ({ id: definition.id, ui });

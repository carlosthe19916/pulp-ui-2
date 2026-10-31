import type React from "react";

import type { ContentEndpoints } from "@app/client/pulpTypes.gen";
import type { FormMode, IFormDef } from "@app/forms";
import type { IEntityField } from "@app/utils/entityField";

import type { IPluginDefinition, TypesOf } from "../definition";
import type {
  ClientSetup,
  IActionUi,
  IContentPanelProps,
  IContentSearch,
  INavPage,
  IPluginBrowse,
  IRepositoryTab,
} from "./contracts";

/** Use the host's generic view for this piece (panel, Browse, client setup). */
export const GENERIC: unique symbol = Symbol("generic");
export type Generic = typeof GENERIC;

/** The UI of one remote, distribution or publication type. */
export interface ITypeUi {
  /** The name in the Type select; defaults to the plugin's label. */
  label?: string;
  form: IFormDef;
}

type RepositoryDefOf<
  D extends IPluginDefinition,
  T extends string,
> = NonNullable<D["repository"]>[T];

/** Each declared action needs its label and fields; a type without actions declares none. */
type ActionsUi<A> =
  A extends Readonly<Record<string, unknown>>
    ? { actions: { [K in keyof A]: IActionUi } }
    : { actions?: never };

export type IRepositoryTypeUi<
  D extends IPluginDefinition,
  T extends string,
> = ITypeUi & {
  /** `["edit"]` for types Pulp creates itself (container push). */
  modes?: readonly FormMode[];
  browse: IPluginBrowse<TypesOf<D, "content">> | Generic;
  /** The plugin's own repository tab, or `null` for none. */
  tab: IRepositoryTab | null;
} & ActionsUi<RepositoryDefOf<D, T>["actions"]>;

export interface IDistributionTypeUi extends ITypeUi {
  clientSetup: ClientSetup | Generic;
}

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
  remote: { [T in TypesOf<D, "remote">]: ITypeUi };
  repository: { [T in TypesOf<D, "repository">]: IRepositoryTypeUi<D, T> };
  distribution: { [T in TypesOf<D, "distribution">]: IDistributionTypeUi };
  publication: { [T in TypesOf<D, "publication">]: ITypeUi };
  content: { [T in TypesOf<D, "content">]: IContentTypeUi<D, T> };
  acs: { label: string };
}

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
};

/** A plugin's definition and its UI, the unit the UI registry holds. */
export interface IPluginModule<
  D extends IPluginDefinition = IPluginDefinition,
> {
  definition: D;
  ui: PluginUi<D>;
}

/** Declares a plugin's UI against its definition. */
export const definePluginUi = <D extends IPluginDefinition>(
  definition: D,
  ui: PluginUi<D>,
): IPluginModule<D> => ({ definition, ui });

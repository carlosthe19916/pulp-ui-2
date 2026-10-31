import type React from "react";

import type { RepositoryResponse } from "@app/client";

import type { FileRoutesByTo } from "../../routeTree.gen";

/**
 * The interfaces between the hosts (generic pages) and a plugin's UI. Hosts depend on these,
 * never on a plugin's files; a plugin implements them.
 */

export type { IActionUi, IPluginAction } from "./action";
export type { IPluginContentProps as IContentPanelProps } from "./blocks/content";
export type {
  IBrowseContext,
  IBrowseSection,
  IPluginBrowse,
} from "./blocks/browse";

export interface IRepositoryTabProps {
  repository: RepositoryResponse;
}

/** A repository detail tab only one plugin has. */
export interface IRepositoryTab {
  key: string;
  title: string;
  Tab: React.ComponentType<IRepositoryTabProps>;
}

/** Where a distribution serves its content; empty strings when it doesn't. */
export interface IClientServedAt {
  name: string;
  baseUrl: string;
  registryPath: string;
  clientUrl: string;
}

/** How a client consumes a distribution: a hint and a copyable snippet. */
export interface IClientSetup {
  hint: string;
  code: string;
}

/** `null` when the distribution isn't served where the client needs it yet. */
export type ClientSetup = (served: IClientServedAt) => IClientSetup | null;

/** The text filter a content type's list offers in pickers. */
export interface IContentSearch<P extends string = string> {
  /** A query param of the type's list endpoint. */
  param: P;
  /** What the user types, e.g. "name". */
  label: string;
}

/** A page of the plugin's own, linked from the Content management navigation. */
export interface INavPage {
  label: string;
  /** A domain-scoped content-management route. */
  to: Extract<
    keyof FileRoutesByTo,
    `/content-management/$pulpDomain/${string}`
  >;
}

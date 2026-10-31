import type React from "react";

import type { RepositoryResponse } from "@app/client";
import type { IContentWrites } from "@app/hooks/useContentUnitSelection";

import type { FileRoutesByTo } from "../../routeTree.gen";
import type { IPluginAction } from "./action";

/**
 * The interfaces between the hosts (generic pages) and a plugin's UI: hosts render them,
 * plugins implement them, and neither imports the other.
 */

export type { IActionUi, IPluginAction } from "./action";

/** A content unit's panel, shown in the content drawer and on its detail page. */
export interface IContentPanelProps {
  href: string;
  /** The repository version the unit is browsed in, when there is one. */
  versionHref?: string;
}

/** Where a repository is served, resolved by the shell; empty strings when it isn't. */
export interface IServedAt {
  /** Content URL, as the "Use this repository" card shows it. */
  baseUrl: string;
  /** Container registry path (`host/namespace/name`). */
  registryPath: string;
}

/** What a Browse section gets from the shell; every list is scoped to `versionHref`. */
export interface IBrowseContext {
  versionHref: string;
  repositoryHref: string;
  /** Where the repository is served, for install commands and download links. */
  served: IServedAt;
  selectedHref?: string;
  /** Opens a content unit in the side drawer. */
  onSelect: (contentHref: string) => void;
  writes?: IContentWrites;
  /** The repository's plugin actions, for views that offer one per row (container untag). */
  actions: readonly IPluginAction[];
}

/** One Browse sub-tab of a plugin, shown only when the version has its content types. */
export interface IBrowseSection<C extends string = string> {
  key: string;
  title: string;
  /** The plugin's content types the section lists. */
  pulpTypes: readonly C[];
  /** Show the `content_summary` count in the tab; off when sections share one type. */
  showCount?: boolean;
  View: React.FC<IBrowseContext>;
}

export interface IPluginBrowse<C extends string = string> {
  sections: readonly IBrowseSection<C>[];
}

export interface IRepositoryTabProps {
  repository: RepositoryResponse;
}

/** A repository detail tab only one plugin has. */
export interface IRepositoryTab {
  key: string;
  title: string;
  Tab: React.ComponentType<IRepositoryTabProps>;
}

/** Where a distribution serves its content, as a client needs it; empty strings when it doesn't. */
export interface IClientServedAt extends IServedAt {
  name: string;
  /** The Galaxy client URL (Ansible). */
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
  /** The page; its route renders it through the registry. */
  Page: React.ComponentType;
  /** A domain-scoped content-management route. */
  to: Extract<
    keyof FileRoutesByTo,
    `/content-management/$pulpDomain/${string}`
  >;
}

export interface ICreateFromModalProps {
  onClose: () => void;
}

/** A remote type's other way to be created, offered next to "Create remote". */
export interface ICreateFromUi {
  label: string;
  /** Owns its form, request and toasts; closes on success. */
  Modal: React.ComponentType<ICreateFromModalProps>;
}

export interface IArchiveImportModalProps {
  repository: RepositoryResponse;
  onClose: () => void;
  /** Hands the started import task to the repository page, which follows it. */
  onStarted: (started: {
    taskHref: string;
    repository: RepositoryResponse;
    title: string;
  }) => void;
}

/** A repository type's archive import, offered in its page's actions. */
export interface IArchiveImportUi {
  label: string;
  Modal: React.ComponentType<IArchiveImportModalProps>;
}

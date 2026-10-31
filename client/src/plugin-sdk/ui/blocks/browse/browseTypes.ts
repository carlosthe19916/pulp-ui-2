import type React from "react";

import type { IContentWrites } from "@app/hooks/useContentUnitSelection";

import type { IPluginAction } from "../../action";

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

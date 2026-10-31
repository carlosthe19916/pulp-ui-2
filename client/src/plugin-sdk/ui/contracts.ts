import type React from "react";

import type { RepositoryResponse } from "@app/client";
import type { IServedAt } from "@app/components/BrowseShell";
import type { useContentChangeTask } from "@app/hooks/useContentChangeTask";

import type { FileRoutesByTo } from "../../routeTree.gen";

/**
 * The interfaces between the hosts (generic pages) and a plugin's UI. Hosts depend on these,
 * never on a plugin's files; a plugin implements them.
 */

export type { IActionUi, IPluginAction } from "./action";
export type { IContentPanelProps } from "@app/components/ContentPanelLayout";
export type {
  IBrowseContext,
  IBrowseSection,
  IPluginBrowse,
  IServedAt,
} from "@app/components/BrowseShell";

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
  onStarted: ReturnType<typeof useContentChangeTask>["watch"];
}

/** A repository type's archive import, offered in its page's actions. */
export interface IArchiveImportUi {
  label: string;
  Modal: React.ComponentType<IArchiveImportModalProps>;
}

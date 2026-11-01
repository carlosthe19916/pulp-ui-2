import type React from "react";

import type { VersionResponse } from "@app/client";
import type { FormMode, IFormDef } from "@app/plugin-forms";
import type { IEntityField } from "@app/utils/entityField";
import {
  ENTITY_TYPES,
  type EntityType,
  getAcsFacts,
  getContentGuardFacts,
  getPulpType,
  type IAcsFact,
  type IContentGuardType,
  isPluginInstalled,
  PLUGIN_DEFINITIONS,
  type PluginId,
  type PulpType,
} from "@catalog";
import {
  type ClientSetup,
  GENERIC,
  type IArchiveImportUi,
  type IContentGuardTypeUi,
  type IContentPanelProps,
  type IContentSearch,
  type ICreateFromUi,
  type INavPage,
  type IPluginAction,
  type IPluginBrowse,
  type IPluginModule,
  type IRepositoryTab,
} from "@plugin-sdk/ui";

import { ansibleUi } from "./ansible/ui";
import { certguardUi } from "./certguard/ui";
import { containerUi } from "./container/ui";
import { coreUi } from "./core/ui";
import { debUi } from "./deb/ui";
import { fileUi } from "./file/ui";
import { gemUi } from "./gem/ui";
import { huggingFaceUi } from "./hugging_face/ui";
import { mavenUi } from "./maven/ui";
import { npmUi } from "./npm/ui";
import { ostreeUi } from "./ostree/ui";
import { pythonUi } from "./python/ui";
import { rpmUi } from "./rpm/ui";

/**
 * Every plugin's UI, keyed by its own id: a plugin defined in `@catalog` without one, or a UI
 * registered under another plugin's id, fails to compile. `definePluginUi` checked each one.
 */
const PLUGIN_UI: { [I in PluginId]: IPluginModule<I> } = {
  file: fileUi,
  rpm: rpmUi,
  python: pythonUi,
  container: containerUi,
  gem: gemUi,
  npm: npmUi,
  maven: mavenUi,
  hugging_face: huggingFaceUi,
  ostree: ostreeUi,
  deb: debUi,
  ansible: ansibleUi,
  core: coreUi,
  certguard: certguardUi,
};

/** A type's form, its name in the Type select, and whether it can be created and edited. */
export interface IFormEntry {
  label: string;
  form: IFormDef;
  modes: readonly FormMode[];
}

/** A plugin's alternate content source: its endpoint and remote type, with its name. */
export interface IAcsType extends IAcsFact {
  pluginId: PluginId;
  label: string;
}

/** A content guard type: its facts with its name, description and form fields. */
export interface IGuardType extends IContentGuardType, IContentGuardTypeUi {}

/** A plugin's own page, with the plugin that must be installed. */
export interface IPluginPage {
  pluginId: PluginId;
  page: INavPage;
}

const BOTH: readonly FormMode[] = ["create", "edit"];
// A publication can't be changed once made: create only.
const DEFAULT_MODES: Record<EntityType, readonly FormMode[]> = {
  remote: BOTH,
  repository: BOTH,
  distribution: BOTH,
  publication: ["create"],
};

const forms = Object.fromEntries(
  ENTITY_TYPES.map((entity) => [entity, new Map<PulpType, IFormEntry>()]),
) as Record<EntityType, Map<PulpType, IFormEntry>>;
const browses = new Map<PulpType, IPluginBrowse>();
const tabs = new Map<PulpType, IRepositoryTab>();
const actions = new Map<PulpType, IPluginAction[]>();
const clientSetups = new Map<PulpType, ClientSetup>();
const panels = new Map<PulpType, React.ComponentType<IContentPanelProps>>();
const searches = new Map<PulpType, IContentSearch>();
const uploads = new Map<PulpType, IEntityField[]>();
const pages: IPluginPage[] = [];
const pageComponents = new Map<INavPage["to"], React.ComponentType>();
const createAlternatives = new Map<
  PulpType,
  (ICreateFromUi & { key: string })[]
>();
const archiveImports = new Map<PulpType, IArchiveImportUi>();
const guardUis = new Map<PulpType, IContentGuardTypeUi>();

// Walk the plugins in declaration order, so lists (nav pages, ACS types) follow it.
for (const { id: pluginId } of PLUGIN_DEFINITIONS) {
  const { ui } = PLUGIN_UI[pluginId];

  for (const entity of ENTITY_TYPES) {
    for (const [pulpType, typeUi] of Object.entries(ui[entity] ?? {})) {
      const modes =
        entity === "repository" ? ui.repository?.[pulpType]?.modes : undefined;
      forms[entity].set(pulpType, {
        label: typeUi.label ?? ui.label,
        form: typeUi.form,
        modes: modes ?? DEFAULT_MODES[entity],
      });
    }
  }
  for (const [pulpType, remoteUi] of Object.entries(ui.remote ?? {})) {
    if (remoteUi.createFrom) {
      createAlternatives.set(
        pulpType,
        Object.entries(remoteUi.createFrom).map(([key, alternative]) => ({
          key,
          ...alternative,
        })),
      );
    }
  }
  for (const [pulpType, repositoryUi] of Object.entries(ui.repository ?? {})) {
    if (repositoryUi.archiveImport) {
      archiveImports.set(pulpType, repositoryUi.archiveImport);
    }
    if (repositoryUi.browse !== GENERIC) {
      browses.set(pulpType, repositoryUi.browse);
    }
    if (repositoryUi.tab) tabs.set(pulpType, repositoryUi.tab);
    // The catalog holds each action's endpoint; `definePluginUi` made each one's UI required.
    actions.set(
      pulpType,
      (getPulpType(pulpType)?.entities.repository?.actions ?? []).flatMap(
        (action) => {
          const actionUi = repositoryUi.actions?.[action.key];
          return actionUi ? [{ ...action, ...actionUi }] : [];
        },
      ),
    );
  }
  for (const [pulpType, distributionUi] of Object.entries(
    ui.distribution ?? {},
  )) {
    if (distributionUi.clientSetup !== GENERIC) {
      clientSetups.set(pulpType, distributionUi.clientSetup);
    }
  }
  for (const [pulpType, contentUi] of Object.entries(ui.content ?? {})) {
    if (contentUi.panel !== GENERIC) panels.set(pulpType, contentUi.panel);
    if (contentUi.search) searches.set(pulpType, contentUi.search);
    if (contentUi.upload) uploads.set(pulpType, contentUi.upload);
  }
  for (const [pulpType, guardUi] of Object.entries(ui.contentGuard ?? {})) {
    guardUis.set(pulpType, guardUi);
  }
  for (const page of ui.pages ?? []) {
    pages.push({ pluginId, page });
    pageComponents.set(page.to, page.Page);
  }
}

// Join the catalog's facts with each one's UI (required by `definePluginUi`), once.
const acsTypes: IAcsType[] = getAcsFacts().map((fact) => {
  const pluginId = fact.pluginId as PluginId;
  const { ui } = PLUGIN_UI[pluginId];
  return { ...fact, pluginId, label: ui.acs?.label ?? ui.label };
});
const guardTypes: IGuardType[] = getContentGuardFacts().flatMap((guard) => {
  const guardUi = guardUis.get(guard.pulpType);
  return guardUi ? [{ ...guard, ...guardUi }] : [];
});

/** Keep only entries whose plugin is installed, when `installed` is given. */
const onlyInstalled = <T extends { pluginId: string }>(
  entries: readonly T[],
  installed: VersionResponse[] | undefined,
): T[] =>
  entries.filter(
    ({ pluginId }) => !installed || isPluginInstalled({ pluginId, installed }),
  );

/** A type's form for `mode`, or `undefined` when it can't be created/edited in that mode. */
export const getEntityForm = ({
  entity,
  pulpType,
  mode,
}: {
  entity: EntityType;
  pulpType: PulpType;
  mode: FormMode;
}): IFormEntry | undefined => {
  const entry = forms[entity].get(pulpType);
  return entry?.modes.includes(mode) ? entry : undefined;
};

/** A type's name as the UI shows it (its Type select label), or the pulp_type when unknown. */
export const getTypeLabel = ({
  entity,
  pulpType,
}: {
  entity: EntityType;
  pulpType: PulpType;
}): string => forms[entity].get(pulpType)?.label ?? pulpType;

/** A content type's own detail panel, or `undefined` for the generic one. */
export const getContentPanel = (
  contentType: PulpType,
): React.ComponentType<IContentPanelProps> | undefined =>
  panels.get(contentType);

/** A repository type's Browse sections, or `undefined` for the generic content list. */
export const getRepositoryBrowse = (
  repositoryType: PulpType,
): IPluginBrowse | undefined => browses.get(repositoryType);

/** A repository type's own extra tab, if its plugin has one. */
export const getRepositoryTab = (
  repositoryType: PulpType,
): IRepositoryTab | undefined => tabs.get(repositoryType);

/** A repository type's plugin actions, ready to run (endpoint, name and fields). */
export const getRepositoryActions = (
  repositoryType: PulpType,
): IPluginAction[] => actions.get(repositoryType) ?? [];

/** How a client consumes a distribution type, or `undefined` for the serving URL alone. */
export const getClientSetup = (
  distributionType: PulpType,
): ClientSetup | undefined => clientSetups.get(distributionType);

/** The filter a content type's picker offers, if its list endpoint has one. */
export const getContentSearch = (
  contentType: PulpType,
): IContentSearch | undefined => searches.get(contentType);

/** What an upload asks for per file (`[]`: just the file). */
export const getUploadFields = (contentType: PulpType): IEntityField[] =>
  uploads.get(contentType) ?? [];

/** The plugins' own pages (only installed plugins', when `installed` is given). */
export const getPluginPages = ({
  installed,
}: { installed?: VersionResponse[] } = {}): IPluginPage[] =>
  onlyInstalled(pages, installed);

/** The component of a plugin's own page, by its route. */
export const getPluginPage = (
  to: INavPage["to"],
): React.ComponentType | undefined => pageComponents.get(to);

/** Every plugin's alternate content source (only installed plugins', when given). */
export const getAcsTypes = ({
  installed,
}: { installed?: VersionResponse[] } = {}): IAcsType[] =>
  onlyInstalled(acsTypes, installed);

/** Every content guard type, in declaration order (only installed plugins', when given). */
export const getContentGuardTypes = ({
  installed,
}: { installed?: VersionResponse[] } = {}): IGuardType[] =>
  onlyInstalled(guardTypes, installed);

/** A remote type's other ways to be created (e.g. from a Bandersnatch config). */
export const getCreateAlternatives = (
  remoteType: PulpType,
): readonly (ICreateFromUi & { key: string })[] =>
  createAlternatives.get(remoteType) ?? [];

/** A repository type's archive import, if its plugin imports archives. */
export const getArchiveImport = (
  repositoryType: PulpType,
): IArchiveImportUi | undefined => archiveImports.get(repositoryType);

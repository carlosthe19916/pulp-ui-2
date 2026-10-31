import type React from "react";

import { BaseContent } from "@app/components/ContentPanelLayout";
import type { FormMode, IFormDef } from "@app/forms";
import type { IEntityField } from "@app/utils/entityField";
import {
  ENTITY_TYPES,
  type EntityType,
  getPulpType,
  PLUGIN_DEFINITIONS,
  type PluginId,
  type PulpType,
} from "@catalog";
import type { IAcsDef } from "@plugin-sdk/definition";
import {
  type ClientSetup,
  GENERIC,
  type IArchiveImportUi,
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
 * Every plugin's UI, by plugin id: a plugin defined in `@catalog` without one fails to compile.
 * Each UI was checked against its definition by `definePluginUi`.
 */
export const PLUGIN_UI: Record<PluginId, IPluginModule> = {
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
};

/** A type's form, its name in the Type select, and whether it can be created and edited. */
export interface IFormEntry {
  label: string;
  form: IFormDef;
  modes: readonly FormMode[];
}

/** A plugin's alternate content source: its endpoint and remote type, with its name. */
export interface IAcsType extends IAcsDef {
  pluginId: PluginId;
  label: string;
}

const BOTH: readonly FormMode[] = ["create", "edit"];
// Publications are immutable: create only.
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
const pages: { pluginId: PluginId; page: INavPage }[] = [];
const pageComponents = new Map<INavPage["to"], React.ComponentType>();
const createAlternatives = new Map<
  PulpType,
  (ICreateFromUi & { key: string })[]
>();
const archiveImports = new Map<PulpType, IArchiveImportUi>();
const acsTypes: IAcsType[] = [];

// Walk the plugins in declaration order, so lists (nav pages, ACS types) follow it.
for (const { id: pluginId } of PLUGIN_DEFINITIONS) {
  const { definition, ui } = PLUGIN_UI[pluginId];

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
  for (const page of ui.pages ?? []) {
    pages.push({ pluginId, page });
    pageComponents.set(page.to, page.Page);
  }
  if (definition.acs) {
    acsTypes.push({
      ...definition.acs,
      pluginId,
      label: ui.acs?.label ?? ui.label,
    });
  }
}

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

/** The content detail panel of a content type (the generic panel when it has none). */
export const getContentPanel = (
  contentType: PulpType,
): React.ComponentType<IContentPanelProps> =>
  panels.get(contentType) ?? BaseContent;

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

/** The plugins' own pages, each with the plugin that must be installed. */
export const getPluginPages = (): readonly {
  pluginId: PluginId;
  page: INavPage;
}[] => pages;

/** Every plugin's alternate content source. */
export const getAcsTypes = (): readonly IAcsType[] => acsTypes;

/** The component of a plugin's own page, by its route. */
export const getPluginPage = (
  to: INavPage["to"],
): React.ComponentType | undefined => pageComponents.get(to);

/** A remote type's other ways to be created (e.g. from a Bandersnatch config). */
export const getCreateAlternatives = (
  remoteType: PulpType,
): readonly (ICreateFromUi & { key: string })[] =>
  createAlternatives.get(remoteType) ?? [];

/** A repository type's archive import, if its plugin imports archives. */
export const getArchiveImport = (
  repositoryType: PulpType,
): IArchiveImportUi | undefined => archiveImports.get(repositoryType);

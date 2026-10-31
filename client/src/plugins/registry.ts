import type React from "react";

import type { EntityType, PulpType } from "@catalog";

import type { FormMode, IFormDef } from "@app/forms";
import type { IEntityField } from "@app/utils/entityField";
import {
  type ClientSetup,
  GENERIC,
  type IContentPanelProps,
  type IContentSearch,
  type INavPage,
  type IPluginAction,
  type IPluginBrowse,
  type IPluginModule,
  type IRepositoryTab,
} from "@plugin-sdk/ui";
import { BaseContent } from "@plugin-sdk/ui/blocks/content";

import { ansibleUi } from "./ansible/ui";
import type { DefinitionOf, PluginId } from "./catalog";
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

/** Every plugin's UI, by plugin id; a plugin defined in `@catalog` without one fails to compile. */
const PLUGIN_UI: { [I in PluginId]: IPluginModule<DefinitionOf<I>> } = {
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

interface ITypeUiShape {
  label?: string;
  form: IFormDef;
  modes?: readonly FormMode[];
  browse?: IPluginBrowse | typeof GENERIC;
  tab?: IRepositoryTab | null;
  actions?: Record<
    string,
    { label: string; description?: string; fields: IEntityField[] }
  >;
  clientSetup?: ClientSetup | typeof GENERIC;
}

interface IContentUiShape {
  panel: React.ComponentType<IContentPanelProps> | typeof GENERIC;
  search: IContentSearch | null;
  upload?: IEntityField[];
}

const BOTH: readonly FormMode[] = ["create", "edit"];
// Publications are immutable: create only.
const DEFAULT_MODES: Record<EntityType, readonly FormMode[]> = {
  remote: BOTH,
  repository: BOTH,
  distribution: BOTH,
  publication: ["create"],
};

const forms = new Map<string, IFormEntry>();
const formKey = (entity: EntityType, pulpType: PulpType) =>
  `${entity}:${pulpType}`;
const browses = new Map<PulpType, IPluginBrowse>();
const tabs = new Map<PulpType, IRepositoryTab>();
const actions = new Map<PulpType, IPluginAction[]>();
const clientSetups = new Map<PulpType, ClientSetup>();
const panels = new Map<PulpType, React.ComponentType<IContentPanelProps>>();
const searches = new Map<PulpType, IContentSearch>();
const uploads = new Map<PulpType, IEntityField[]>();
const pages: { pluginId: PluginId; page: INavPage }[] = [];
const acsLabels = new Map<PluginId, string>();

// The modules' UI is typed per plugin; here every plugin is read through one shape.
for (const [pluginId, module] of Object.entries(PLUGIN_UI) as unknown as [
  PluginId,
  IPluginModule,
][]) {
  const { definition, ui } = module;
  const sections = ui as unknown as Partial<
    Record<EntityType, Record<PulpType, ITypeUiShape>>
  > & { content?: Record<PulpType, IContentUiShape>; acs?: { label: string } };

  for (const entity of [
    "remote",
    "repository",
    "distribution",
    "publication",
  ] as const) {
    for (const [pulpType, typeUi] of Object.entries(sections[entity] ?? {})) {
      forms.set(formKey(entity, pulpType), {
        label: typeUi.label ?? ui.label,
        form: typeUi.form,
        modes: typeUi.modes ?? DEFAULT_MODES[entity],
      });
      if (typeUi.browse && typeUi.browse !== GENERIC) {
        browses.set(pulpType, typeUi.browse);
      }
      if (typeUi.tab) tabs.set(pulpType, typeUi.tab);
      if (typeUi.clientSetup && typeUi.clientSetup !== GENERIC) {
        clientSetups.set(pulpType, typeUi.clientSetup);
      }
      if (entity === "repository") {
        const defs = definition.repository?.[pulpType]?.actions ?? {};
        actions.set(
          pulpType,
          Object.entries(defs).map(([key, action]) => ({
            key,
            ...action,
            ...(typeUi.actions?.[key] ?? { label: key, fields: [] }),
          })),
        );
      }
    }
  }
  for (const [pulpType, contentUi] of Object.entries(sections.content ?? {})) {
    if (contentUi.panel !== GENERIC) panels.set(pulpType, contentUi.panel);
    if (contentUi.search) searches.set(pulpType, contentUi.search);
    if (contentUi.upload) uploads.set(pulpType, contentUi.upload);
  }
  for (const page of ui.pages ?? []) pages.push({ pluginId, page });
  if (sections.acs) acsLabels.set(pluginId, sections.acs.label);
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
  const entry = forms.get(formKey(entity, pulpType));
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
export const getPluginPages = () => pages;

/** The label of a plugin's alternate content source. */
export const getAcsLabel = (pluginId: PluginId): string | undefined =>
  acsLabels.get(pluginId);

/** Every registered form, for conformance tests. */
export const registeredForms = () =>
  [...forms.entries()].map(([key, entry]) => {
    const [entity, pulpType] = key.split(":") as [EntityType, PulpType];
    return { entity, pulpType, entry };
  });

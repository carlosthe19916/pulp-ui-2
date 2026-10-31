import type { VersionResponse } from "@app/client";

import {
  type ContentUploadMechanism,
  ENTITY_TYPES,
  type EntityType,
  type IActionDef,
  type IPluginDefinition,
  type IRepositoryDef,
  type IsInstalled,
  type PulpType,
} from "./types";

/** One entity's endpoint for a pulp_type. */
export interface IPluginEntity {
  apiPath: string;
  /** Exposes per-object role endpoints (`my_permissions/` etc.); default true. */
  rolesManaged?: boolean;
}

export interface IRepositoryAction extends IActionDef {
  key: string;
}

export interface IPluginRepositoryEntity extends IPluginEntity {
  compatibleRemoteTypes: PulpType[];
  compatiblePublicationTypes: PulpType[];
  contentChanges: "modify" | "addRemove" | null;
  archiveImport: boolean;
  scan: boolean;
  actions: IRepositoryAction[];
  /** Its plugin's content types. */
  contentTypes: PulpType[];
}

/** A content type: its list endpoint (absent for endpoint-less types) and upload mechanism. */
export interface IContentType {
  pulpType: PulpType;
  apiPath?: string;
  uploadable?: { mechanism: ContentUploadMechanism };
}

/** What each entity offers for one pulp_type (a pulp_type can name several entities). */
export interface IPlugin {
  pulpType: PulpType;
  /** The id of the plugin that declares it. */
  pluginId: string;
  isAvailable: IsInstalled;
  entities: {
    repository?: IPluginRepositoryEntity;
    remote?: IPluginEntity;
    distribution?: IPluginEntity;
    publication?: IPluginEntity;
  };
}

/** True when any of the plugin's packages is installed. */
const installedCheck =
  (packages: readonly string[]): IsInstalled =>
  (installed) =>
    installed.some(
      (version) =>
        packages.includes(version.component ?? "") ||
        packages.includes(version.package ?? ""),
    );

/** What every entity type declares; repository types add their capabilities. */
type IEntityDefShape = IPluginEntity | IRepositoryDef;

const isRepositoryDef = (def: IEntityDefShape): def is IRepositoryDef =>
  "contentChanges" in def;

const contentTypesOf = (definition: IPluginDefinition): IContentType[] =>
  Object.entries(definition.content ?? {}).map(([pulpType, content]) => ({
    pulpType,
    apiPath: content.apiPath,
    uploadable: content.upload ? { mechanism: content.upload } : undefined,
  }));

/**
 * The read API over a set of plugin definitions: lookups by pulp_type and apiPath. Throws on a
 * pulp_type declared twice for one entity, or a content type or content apiPath declared twice.
 */
export const createCatalog = (definitions: readonly IPluginDefinition[]) => {
  const byType = new Map<PulpType, IPlugin>();
  const apiPathIndex = Object.fromEntries(
    ENTITY_TYPES.map((entity) => [entity, new Map<string, PulpType>()]),
  ) as Record<EntityType, Map<string, PulpType>>;
  const contentByType = new Map<PulpType, IContentType>();
  const contentByApiPath = new Map<string, PulpType>();
  const contentByPlugin = new Map<string, IContentType[]>();
  const isInstalledById = new Map<string, IsInstalled>();

  for (const definition of definitions) {
    const isAvailable = installedCheck(definition.packages);
    isInstalledById.set(definition.id, isAvailable);
    const contentTypes = contentTypesOf(definition);
    contentByPlugin.set(definition.id, contentTypes);

    for (const entity of ENTITY_TYPES) {
      const types: Readonly<Record<string, IEntityDefShape>> =
        definition[entity] ?? {};
      for (const [pulpType, def] of Object.entries(types)) {
        const plugin = byType.get(pulpType) ?? {
          pulpType,
          pluginId: definition.id,
          isAvailable,
          entities: {},
        };
        byType.set(pulpType, plugin);
        if (plugin.entities[entity]) {
          throw new Error(`Duplicate ${entity} type "${pulpType}".`);
        }
        const base = { apiPath: def.apiPath, rolesManaged: def.rolesManaged };
        if (isRepositoryDef(def)) {
          plugin.entities.repository = {
            ...base,
            compatibleRemoteTypes: [...def.compatibleRemoteTypes],
            compatiblePublicationTypes: [...def.compatiblePublicationTypes],
            contentChanges: def.contentChanges,
            archiveImport: def.archiveImport ?? false,
            scan: def.scan ?? false,
            actions: Object.entries(def.actions ?? {}).map(([key, action]) => ({
              key,
              ...action,
            })),
            contentTypes: contentTypes.map((content) => content.pulpType),
          };
        } else if (entity !== "repository") {
          plugin.entities[entity] = base;
        }
        apiPathIndex[entity].set(def.apiPath, pulpType);
      }
    }

    for (const content of contentTypes) {
      if (contentByType.has(content.pulpType)) {
        throw new Error(`Duplicate content type "${content.pulpType}".`);
      }
      contentByType.set(content.pulpType, content);
      if (content.apiPath) {
        if (contentByApiPath.has(content.apiPath)) {
          throw new Error(`Duplicate content apiPath "${content.apiPath}".`);
        }
        contentByApiPath.set(content.apiPath, content.pulpType);
      }
    }
  }

  const plugins = [...byType.values()];
  const isPluginInstalled = ({
    pluginId,
    installed,
  }: {
    pluginId: string;
    installed: VersionResponse[];
  }) => isInstalledById.get(pluginId)?.(installed) ?? false;

  return {
    /** What each entity offers for a pulp_type, or `undefined` if no plugin declares it. */
    getPlugin: (pulpType: PulpType): IPlugin | undefined =>
      byType.get(pulpType),

    /** Pulp types of `entity` whose plugin is installed, in declaration order. */
    getAvailablePlugins: ({
      entity,
      installed,
    }: {
      entity: EntityType;
      installed: VersionResponse[];
    }): IPlugin[] =>
      plugins.filter(
        (plugin) => plugin.entities[entity] && plugin.isAvailable(installed),
      ),

    isPluginInstalled,

    /** The content type for a content pulp_type, or `undefined` if not modelled. */
    getContentType: (pulpType: PulpType): IContentType | undefined =>
      contentByType.get(pulpType),

    /** Content types across plugins (optionally only installed plugins'). */
    getContentTypes: ({
      installed,
    }: { installed?: VersionResponse[] } = {}): IContentType[] =>
      definitions.flatMap((definition) =>
        !installed || isPluginInstalled({ pluginId: definition.id, installed })
          ? (contentByPlugin.get(definition.id) ?? [])
          : [],
      ),

    /** The content types a repository type can hold, or `[]` for an unknown type. */
    getRepositoryContentTypes: (repositoryType: PulpType): IContentType[] =>
      (
        byType.get(repositoryType)?.entities.repository?.contentTypes ?? []
      ).flatMap((pulpType) => contentByType.get(pulpType) ?? []),

    /** Repository types that hold a content type and can change their content. */
    getRepositoryTypesForContent: (contentType: PulpType): PulpType[] =>
      plugins
        .filter((plugin) => {
          const repository = plugin.entities.repository;
          return (
            !!repository?.contentChanges &&
            repository.contentTypes.includes(contentType)
          );
        })
        .map((plugin) => plugin.pulpType),

    /** Repository types that publish to a publication type. */
    getRepositoryTypesForPublication: (publicationType: PulpType): PulpType[] =>
      plugins
        .filter((plugin) =>
          plugin.entities.repository?.compatiblePublicationTypes.includes(
            publicationType,
          ),
        )
        .map((plugin) => plugin.pulpType),

    /** Repository types whose versions can be scanned for vulnerabilities. */
    getScannableRepositoryTypes: (): PulpType[] =>
      plugins
        .filter((plugin) => plugin.entities.repository?.scan)
        .map((plugin) => plugin.pulpType),

    /** Each plugin's alternate content source, with the plugin it belongs to. */
    getAcsSources: () =>
      definitions.flatMap((definition) =>
        definition.acs ? [{ pluginId: definition.id, ...definition.acs }] : [],
      ),

    /** Resolve a pulp_type from an entity and its href's `<app>/<slug>` segment. */
    resolvePulpTypeByApiPath: ({
      entity,
      apiPath,
    }: {
      entity: EntityType;
      apiPath: string;
    }): PulpType | undefined => apiPathIndex[entity].get(apiPath),

    /** Resolve a content pulp_type from its collection apiPath. */
    resolveContentTypeByApiPath: ({
      apiPath,
    }: {
      apiPath: string;
    }): PulpType | undefined => contentByApiPath.get(apiPath),
  };
};

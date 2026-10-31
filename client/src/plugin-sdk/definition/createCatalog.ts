import type { VersionResponse } from "@app/client";

import {
  type ContentUploadMechanism,
  ENTITY_TYPES,
  type EntityType,
  type IAcsDef,
  type IActionDef,
  type IPluginDefinition,
  type IsInstalled,
  type PulpType,
} from "./types";

/** One entity's endpoint for a pulp_type. */
export interface IPulpTypeEntity {
  apiPath: string;
  /** Exposes per-object role endpoints (`my_permissions/` etc.). */
  rolesManaged: boolean;
}

export interface IRepositoryAction extends IActionDef {
  key: string;
}

export interface IPulpTypeRepository extends IPulpTypeEntity {
  compatibleRemoteTypes: PulpType[];
  compatiblePublicationTypes: PulpType[];
  contentChanges: "modify" | "addRemove" | null;
  archiveImport: boolean;
  /** Its versions can be scanned: it declares a version `scan/` action. */
  scan: boolean;
  actions: IRepositoryAction[];
  /** Its plugin's content types. */
  contentTypes: PulpType[];
}

/** A content type: its list endpoint (absent for endpoint-less types) and upload mechanism. */
export interface IContentType {
  pulpType: PulpType;
  apiPath?: string;
  upload?: ContentUploadMechanism;
}

/** A content guard type: its collection, role endpoints and download roles. */
export interface IContentGuardType {
  pulpType: PulpType;
  pluginId: string;
  apiPath: string;
  rolesManaged: boolean;
  downloaderRole: boolean;
}

/** A plugin's alternate content source endpoint, with the plugin it belongs to. */
export interface IAcsFact extends IAcsDef {
  pluginId: string;
}

/** What each entity offers for one pulp_type (a pulp_type can name several entities). */
export interface IPulpType {
  pulpType: PulpType;
  /** The id of the plugin that declares it. */
  pluginId: string;
  isAvailable: IsInstalled;
  entities: {
    repository?: IPulpTypeRepository;
    remote?: IPulpTypeEntity;
    distribution?: IPulpTypeEntity;
    publication?: IPulpTypeEntity;
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

const contentTypesOf = (definition: IPluginDefinition): IContentType[] =>
  Object.entries(definition.content ?? {}).map(([pulpType, content]) => ({
    pulpType,
    apiPath: content.apiPath,
    upload: content.upload,
  }));

const isScan = (action: IActionDef) =>
  action.target === "version" && action.path === "scan/";

/**
 * The read API over a set of plugin definitions: lookups by pulp_type and apiPath. Throws on a
 * pulp_type or `(entity, apiPath)` declared twice, a pulp_type two plugins claim, or a content or
 * content guard type (or content apiPath) declared twice.
 */
export const createCatalog = (definitions: readonly IPluginDefinition[]) => {
  const byType = new Map<PulpType, IPulpType>();
  const apiPathIndex = Object.fromEntries(
    ENTITY_TYPES.map((entity) => [entity, new Map<string, PulpType>()]),
  ) as Record<EntityType, Map<string, PulpType>>;
  const contentByType = new Map<PulpType, IContentType>();
  const contentByApiPath = new Map<string, PulpType>();
  const contentByPlugin = new Map<string, IContentType[]>();
  const guardsByType = new Map<PulpType, IContentGuardType>();
  const acsFacts: IAcsFact[] = [];
  const isInstalledById = new Map<string, IsInstalled>();

  for (const definition of definitions) {
    const isAvailable = installedCheck(definition.packages);
    isInstalledById.set(definition.id, isAvailable);
    const contentTypes = contentTypesOf(definition);
    contentByPlugin.set(definition.id, contentTypes);

    const entry = (entity: EntityType, pulpType: PulpType, apiPath: string) => {
      const typeInfo = byType.get(pulpType) ?? {
        pulpType,
        pluginId: definition.id,
        isAvailable,
        entities: {},
      };
      // Install checks and UI lookups are per pulp_type, so one plugin owns each.
      if (typeInfo.pluginId !== definition.id) {
        throw new Error(
          `"${pulpType}" is declared by both "${typeInfo.pluginId}" and "${definition.id}".`,
        );
      }
      if (typeInfo.entities[entity]) {
        throw new Error(`Duplicate ${entity} type "${pulpType}".`);
      }
      if (apiPathIndex[entity].has(apiPath)) {
        throw new Error(`Duplicate ${entity} apiPath "${apiPath}".`);
      }
      byType.set(pulpType, typeInfo);
      apiPathIndex[entity].set(apiPath, pulpType);
      return typeInfo;
    };

    for (const [pulpType, def] of Object.entries(definition.repository ?? {})) {
      const actions = Object.entries(def.actions ?? {}).map(
        ([key, action]) => ({ key, ...action }),
      );
      entry("repository", pulpType, def.apiPath).entities.repository = {
        apiPath: def.apiPath,
        rolesManaged: def.rolesManaged ?? true,
        compatibleRemoteTypes: [...def.compatibleRemoteTypes],
        compatiblePublicationTypes: [...def.compatiblePublicationTypes],
        contentChanges: def.contentChanges,
        archiveImport: def.archiveImport ?? false,
        scan: actions.some(isScan),
        actions,
        contentTypes: contentTypes.map((content) => content.pulpType),
      };
    }
    for (const entity of ["remote", "distribution", "publication"] as const) {
      for (const [pulpType, def] of Object.entries(definition[entity] ?? {})) {
        entry(entity, pulpType, def.apiPath).entities[entity] = {
          apiPath: def.apiPath,
          rolesManaged: def.rolesManaged ?? true,
        };
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

    for (const [pulpType, guard] of Object.entries(
      definition.contentGuard ?? {},
    )) {
      if (guardsByType.has(pulpType)) {
        throw new Error(`Duplicate content guard type "${pulpType}".`);
      }
      guardsByType.set(pulpType, {
        pulpType,
        pluginId: definition.id,
        apiPath: guard.apiPath,
        rolesManaged: guard.rolesManaged ?? true,
        downloaderRole: guard.downloaderRole ?? false,
      });
    }

    if (definition.acs) {
      acsFacts.push({ pluginId: definition.id, ...definition.acs });
    }
  }

  const pulpTypes = [...byType.values()];
  const isPluginInstalled = ({
    pluginId,
    installed,
  }: {
    pluginId: string;
    installed: VersionResponse[];
  }) => isInstalledById.get(pluginId)?.(installed) ?? false;

  return {
    /** What each entity offers for a pulp_type, or `undefined` if no plugin declares it. */
    getPulpType: (pulpType: PulpType): IPulpType | undefined =>
      byType.get(pulpType),

    /** Pulp types of `entity` whose plugin is installed, in declaration order. */
    getAvailableTypes: ({
      entity,
      installed,
    }: {
      entity: EntityType;
      installed: VersionResponse[];
    }): IPulpType[] =>
      pulpTypes.filter(
        (typeInfo) =>
          typeInfo.entities[entity] && typeInfo.isAvailable(installed),
      ),

    /** Whether any of a plugin's packages is installed. */
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
      pulpTypes
        .filter((typeInfo) => {
          const repository = typeInfo.entities.repository;
          return (
            !!repository?.contentChanges &&
            repository.contentTypes.includes(contentType)
          );
        })
        .map((typeInfo) => typeInfo.pulpType),

    /** Repository types that publish to a publication type. */
    getRepositoryTypesForPublication: (publicationType: PulpType): PulpType[] =>
      pulpTypes
        .filter((typeInfo) =>
          typeInfo.entities.repository?.compatiblePublicationTypes.includes(
            publicationType,
          ),
        )
        .map((typeInfo) => typeInfo.pulpType),

    /** Repository types whose versions can be scanned (optionally only installed plugins'). */
    getScannableRepositoryTypes: ({
      installed,
    }: { installed?: VersionResponse[] } = {}): PulpType[] =>
      pulpTypes
        .filter(
          (typeInfo) =>
            !!typeInfo.entities.repository?.scan &&
            (!installed || typeInfo.isAvailable(installed)),
        )
        .map((typeInfo) => typeInfo.pulpType),

    /** Every content guard type's facts; `@plugins.getContentGuardTypes` adds their UI. */
    getContentGuardFacts: (): IContentGuardType[] => [...guardsByType.values()],

    /** Every plugin's ACS endpoint; `@plugins.getAcsTypes` adds its name. */
    getAcsFacts: (): IAcsFact[] => acsFacts,

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

    /** Resolve a content guard type from its collection apiPath. */
    resolveContentGuardTypeByApiPath: ({
      apiPath,
    }: {
      apiPath: string;
    }): IContentGuardType | undefined =>
      [...guardsByType.values()].find((guard) => guard.apiPath === apiPath),
  };
};

import type { VersionResponse } from "@app/client";
import type {
  AcsEndpoints,
  ContentEndpoints,
  ContentGuardEndpoints,
  DistributionEndpoints,
  PublicationEndpoints,
  RemoteEndpoints,
  RepositoryEndpoints,
} from "@app/client/pulpTypes.gen";

/**
 * What Pulp is: the facts a plugin definition states, checkable against the API. Nothing here
 * is presentation (labels, forms, views); that is the plugin's UI (`plugin-sdk/ui`).
 */

/** The entity types a plugin declares per pulp_type (content and content guards are apart). */
export const ENTITY_TYPES = [
  "repository",
  "remote",
  "distribution",
  "publication",
] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];

/** The generated endpoint map of each entity's collections, keyed by apiPath. */
export interface IEndpointsByEntity {
  remote: RemoteEndpoints;
  repository: RepositoryEndpoints;
  distribution: DistributionEndpoints;
  publication: PublicationEndpoints;
}

/** A Pulp type identifier, e.g. "file.file" or "rpm.uln". */
export type PulpType = string;

interface IEntityTypeDef<E extends EntityType> {
  /** The `<app>/<slug>` collection segment; must exist in the OpenAPI spec. */
  apiPath: keyof IEndpointsByEntity[E] & string;
  /** Exposes per-object role endpoints (`my_permissions/` etc.); default true. */
  rolesManaged?: boolean;
}

/**
 * A POST that starts a task. `path` is relative to the target's href (`sign/`), or a
 * collection endpoint when it starts with `/` (`/rpm/copy/`).
 */
export interface IActionDef {
  path: string;
  target: "repository" | "version";
  /** For collection endpoints: the body field the repository href fills (`list`: as a list). */
  repositoryParam?: { key: string; list?: boolean };
}

/** Another way to create an object of a type: a POST relative to its collection. */
export interface ICreateFromDef {
  /** Relative to the type's collection, e.g. `from_bandersnatch/`. */
  path: string;
}

export interface IRemoteDef extends IEntityTypeDef<"remote"> {
  /** Endpoints that create a remote from something else (a Bandersnatch config), by key. */
  createFrom?: Readonly<Record<string, ICreateFromDef>>;
}

export interface IRepositoryDef extends IEntityTypeDef<"repository"> {
  /** Remote types it syncs from (backend `REMOTE_TYPES`); `[]` when it can't sync. */
  compatibleRemoteTypes: readonly string[];
  /** Publication types it publishes to; `[]` when it can't publish. */
  compatiblePublicationTypes: readonly string[];
  /**
   * How content is added/removed: `modify` (one `modify/` call) or `addRemove` (container's
   * `add/` and `remove/`); `null` when it can't be (container push).
   */
  contentChanges: "modify" | "addRemove" | null;
  /** Imports an uploaded archive into a new version (OSTree `import_all/`). */
  archiveImport?: boolean;
  /** Plugin actions (sign, tag, copy…), by key; a version `scan/` action makes it scannable. */
  actions?: Readonly<Record<string, IActionDef>>;
}

/**
 * How a content unit is uploaded: `upload` to the synchronous `<apiPath>/upload/` (201 +
 * content), or `create` to `<apiPath>/` (202 + task).
 */
export type ContentUploadMechanism = "upload" | "create";

export interface IContentDef {
  /** Omitted for endpoint-less types (listed only inside a version). */
  apiPath?: keyof ContentEndpoints & string;
  /** Absent: read-only (sync or push only). */
  upload?: ContentUploadMechanism;
}

/** A content guard type: who may download content a distribution serves. */
export interface IContentGuardDef {
  apiPath: keyof ContentGuardEndpoints & string;
  /** Exposes per-object role endpoints (`my_permissions/` etc.); default true. */
  rolesManaged?: boolean;
  /** Downloads are granted through the guard's own downloader role (RBAC). */
  downloaderRole?: boolean;
}

/** The plugin's alternate content source collection. */
export interface IAcsDef {
  apiPath: keyof AcsEndpoints & string;
  /** The remote type an ACS of this plugin points at. */
  remoteType: string;
}

/**
 * A plugin: the packages that mean it is installed, then its types per entity, keyed by
 * pulp_type. One pulp_type can name several of a plugin's entities; two plugins never share one.
 */
export interface IPluginDefinition {
  id: string;
  /** Component or package names (`/status/` versions) that mean it is installed. */
  packages: readonly string[];
  remote?: Readonly<Record<string, IRemoteDef>>;
  repository?: Readonly<Record<string, IRepositoryDef>>;
  distribution?: Readonly<Record<string, IEntityTypeDef<"distribution">>>;
  publication?: Readonly<Record<string, IEntityTypeDef<"publication">>>;
  content?: Readonly<Record<string, IContentDef>>;
  acs?: IAcsDef;
  contentGuard?: Readonly<Record<string, IContentGuardDef>>;
}

/** The sections of a definition that declare types keyed by pulp_type. */
export type TypeSection = EntityType | "content" | "contentGuard";

/** A definition's pulp_types for one of its sections (`never` when it has none). */
export type TypesOf<
  D extends IPluginDefinition,
  S extends TypeSection,
> = S extends keyof D ? keyof NonNullable<D[S]> & string : never;

export type IsInstalled = (installed: VersionResponse[]) => boolean;

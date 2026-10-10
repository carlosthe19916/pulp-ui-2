import type { EntityType } from "@catalog";
import { distributionsRootQueryOptions } from "@app/queries/distributions";
import { publicationsRootQueryOptions } from "@app/queries/publications";
import { remotesRootQueryOptions } from "@app/queries/remotes";
import { repositoriesRootQueryOptions } from "@app/queries/repositories";
import type { ContentFamily } from "@app/queries/utils/entityCrud";

/**
 * Binds a content family's entity-type `kind` to its aggregate REST collection
 * and query-key root, so the generic list/modal/CRUD shell can serve all four
 * families uniformly. Plugin-type specifics (fields, wizard, remote types) live
 * in the catalog, keyed by `kind` + pulp_type.
 */
export interface IContentFamilyConfig {
  /** Catalog join key (an entity type); not a query field. */
  kind: EntityType;
  /** TanStack/REST: aggregate collection prefix (e.g. "remotes"). */
  family: ContentFamily;
  /** TanStack: cache-key root for the family. */
  rootQueryKey: readonly unknown[];
}

export const REMOTE_FAMILY: IContentFamilyConfig = {
  kind: "remote",
  family: "remotes",
  rootQueryKey: remotesRootQueryOptions.queryKey,
};

export const REPOSITORY_FAMILY: IContentFamilyConfig = {
  kind: "repository",
  family: "repositories",
  rootQueryKey: repositoriesRootQueryOptions.queryKey,
};

export const DISTRIBUTION_FAMILY: IContentFamilyConfig = {
  kind: "distribution",
  family: "distributions",
  rootQueryKey: distributionsRootQueryOptions.queryKey,
};

export const PUBLICATION_FAMILY: IContentFamilyConfig = {
  kind: "publication",
  family: "publications",
  rootQueryKey: publicationsRootQueryOptions.queryKey,
};

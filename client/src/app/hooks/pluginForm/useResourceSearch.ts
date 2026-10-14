import { useQuery } from "@tanstack/react-query";

import type { EntityType } from "@catalog";
import type { ITypeaheadOption } from "@app/components/TypeaheadSelect";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import { publicationsListQueryOptions } from "@app/queries/publications";
import {
  remotesListQueryOptions,
  useRemoteDetailQuery,
} from "@app/queries/remotes";
import {
  repositoriesListQueryOptions,
  useRepositoryDetailQuery,
} from "@app/queries/repositories";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";

/** One page of options per keystroke — the picker is a search, not a full list. */
const PAGE_SIZE = 20;

export interface IResourceSearch {
  options: ITypeaheadOption[];
  isLoading: boolean;
  /** Label for the currently-selected href (may be outside the current page). */
  selectedLabel?: string;
}

interface IUseResourceSearchArgs {
  resourceKind: EntityType;
  /** Debounced search text typed into the dropdown. */
  term: string;
  /** The field's current value (href), for resolving its label in edit mode. */
  selectedHref: string;
  /** Gate the list fetch — true only while the dropdown is open (lazy load). */
  enabled: boolean;
  /** Compatibility predicate (e.g. a repository's compatible remote types). */
  filter?: (href: string) => boolean;
}

/**
 * Server-side typeahead search for a single `asyncResource` field. Only the query
 * for the field's `resourceKind` runs, and only while the dropdown is open — so no
 * resource list is fetched unless the schema has such a field and the user opens it.
 * Repositories/remotes search server-side by name; publications (no name filter)
 * fetch a page and filter client-side by their `Publication <id>` label.
 *
 * All three list queries are declared unconditionally (rules of hooks) and gated by
 * `enabled`; the inactive ones never fire.
 */
export const useResourceSearch = ({
  resourceKind,
  term,
  selectedHref,
  enabled,
  filter,
}: IUseResourceSearchArgs): IResourceSearch => {
  const domain = useSelectedDomain();

  const isRepository = resourceKind === "repository";
  const isRemote = resourceKind === "remote";
  const isPublication = resourceKind === "publication";

  const repositoryQuery = useQuery({
    ...repositoriesListQueryOptions(domain, {
      limit: PAGE_SIZE,
      offset: 0,
      ordering: "name",
      name__icontains: term || undefined,
    }),
    enabled: enabled && isRepository,
  });
  const remoteQuery = useQuery({
    ...remotesListQueryOptions(domain, {
      limit: PAGE_SIZE,
      offset: 0,
      ordering: "name",
      name__icontains: term || undefined,
    }),
    enabled: enabled && isRemote,
  });
  const publicationQuery = useQuery({
    ...publicationsListQueryOptions(domain, { limit: PAGE_SIZE, offset: 0 }),
    enabled: enabled && isPublication,
  });

  // Resolve the selected item's label (edit mode): it may be outside the current
  // search page. Each family's detail-by-href is gated to the active kind + href;
  // publications derive the label from the id, so they need no detail fetch.
  const { data: selectedRepository } = useRepositoryDetailQuery(
    isRepository ? selectedHref : "",
  );
  const { data: selectedRemote } = useRemoteDetailQuery(
    isRemote ? selectedHref : "",
  );
  const selectedDetail = isRepository ? selectedRepository : selectedRemote;

  if (isPublication) {
    const query = term.trim().toLowerCase();
    const options = (publicationQuery.data?.results ?? [])
      .filter((pub) => !filter || filter(pub.pulp_href ?? ""))
      .map((pub) => ({
        value: pub.pulp_href ?? "",
        label: pub.pulp_href
          ? `Publication ${extractIdFromHref(pub.pulp_href)}`
          : "",
      }))
      .filter((option) => !query || option.label.toLowerCase().includes(query));
    return {
      options,
      isLoading: publicationQuery.isFetching,
      selectedLabel: selectedHref
        ? `Publication ${extractIdFromHref(selectedHref)}`
        : undefined,
    };
  }

  const activeQuery = isRepository ? repositoryQuery : remoteQuery;
  const options = (activeQuery.data?.results ?? [])
    .filter((item) => !filter || filter(item.pulp_href ?? ""))
    .map((item) => ({ value: item.pulp_href ?? "", label: item.name ?? "" }));

  return {
    options,
    isLoading: activeQuery.isFetching,
    selectedLabel: selectedDetail?.name,
  };
};

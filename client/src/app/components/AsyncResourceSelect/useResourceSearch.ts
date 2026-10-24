import { useQuery } from "@tanstack/react-query";

import type { ResourceKind } from "@catalog";
import type { ITypeaheadOption } from "@app/components/TypeaheadSelect";
import { useDefaultDomain } from "@app/hooks/useDefaultDomain";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import {
  contentGuardsListQueryOptions,
  useContentGuardDetailQuery,
} from "@app/queries/content-guards";
import { publicationsListQueryOptions } from "@app/queries/publications";
import {
  remotesListQueryOptions,
  useRemoteDetailQuery,
} from "@app/queries/remotes";
import {
  repositoriesListQueryOptions,
  useRepositoryDetailQuery,
} from "@app/queries/repositories";
import {
  signingServicesListQueryOptions,
  useSigningServiceDetailQuery,
} from "@app/queries/signing-services";
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
  resourceKind: ResourceKind;
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
 * All list queries are declared unconditionally (rules of hooks) and gated by
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
  const defaultDomain = useDefaultDomain();

  const isRepository = resourceKind === "repository";
  const isRemote = resourceKind === "remote";
  const isPublication = resourceKind === "publication";
  const isSigningService = resourceKind === "signingService";
  const isContentGuard = resourceKind === "contentGuard";

  const repositoryQuery = useQuery({
    ...repositoriesListQueryOptions({
      domain,
      params: {
        limit: PAGE_SIZE,
        offset: 0,
        ordering: "name",
        name__icontains: term || undefined,
      },
    }),
    enabled: enabled && isRepository,
  });
  const remoteQuery = useQuery({
    ...remotesListQueryOptions({
      domain,
      params: {
        limit: PAGE_SIZE,
        offset: 0,
        ordering: "name",
        name__icontains: term || undefined,
      },
    }),
    enabled: enabled && isRemote,
  });
  const publicationQuery = useQuery({
    ...publicationsListQueryOptions({
      domain,
      params: { limit: PAGE_SIZE, offset: 0 },
    }),
    enabled: enabled && isPublication,
  });

  const signingServiceQuery = useQuery({
    ...signingServicesListQueryOptions({
      domain: defaultDomain,
      // Few exist and the list has no "contains" filter: search client-side.
      params: { limit: 100, offset: 0, ordering: "name" },
    }),
    enabled: enabled && isSigningService,
  });
  const contentGuardQuery = useQuery({
    ...contentGuardsListQueryOptions({
      domain,
      params: {
        limit: PAGE_SIZE,
        offset: 0,
        ordering: "name",
        name__icontains: term || undefined,
      },
    }),
    enabled: enabled && isContentGuard,
  });

  // Resolve the selected item's label (edit mode): it may be outside the current
  // search page. Each family's detail-by-href is gated to the active kind + href;
  // publications derive the label from the id, so they need no detail fetch.
  const { data: selectedRepository } = useRepositoryDetailQuery({
    href: isRepository ? selectedHref : "",
  });
  const { data: selectedRemote } = useRemoteDetailQuery({
    href: isRemote ? selectedHref : "",
  });
  const { data: selectedSigningService } = useSigningServiceDetailQuery({
    href: isSigningService ? selectedHref : "",
  });
  const { data: selectedContentGuard } = useContentGuardDetailQuery({
    href: isContentGuard ? selectedHref : "",
  });

  if (isPublication) {
    const query = term.trim().toLowerCase();
    const options: { value: string; label: string }[] = [];
    for (const pub of publicationQuery.data?.results ?? []) {
      const href = pub.pulp_href ?? "";
      if (filter && !filter(href)) {
        continue;
      }
      const label = href ? `Publication ${extractIdFromHref(href)}` : "";
      if (query && !label.toLowerCase().includes(query)) {
        continue;
      }
      options.push({ value: href, label });
    }
    return {
      options,
      isLoading: publicationQuery.isFetching,
      selectedLabel: selectedHref
        ? `Publication ${extractIdFromHref(selectedHref)}`
        : undefined,
    };
  }

  const { activeQuery, selectedDetail } = (() => {
    if (isSigningService) {
      return {
        activeQuery: signingServiceQuery,
        selectedDetail: selectedSigningService,
      };
    }
    if (isContentGuard) {
      return {
        activeQuery: contentGuardQuery,
        selectedDetail: selectedContentGuard,
      };
    }
    if (isRepository) {
      return {
        activeQuery: repositoryQuery,
        selectedDetail: selectedRepository,
      };
    }
    return { activeQuery: remoteQuery, selectedDetail: selectedRemote };
  })();
  const items: { pulp_href?: string; name?: string }[] =
    activeQuery.data?.results ?? [];
  const needle = term.trim().toLowerCase();
  const options = items
    .filter((item) => !filter || filter(item.pulp_href ?? ""))
    .filter(
      (item) =>
        !isSigningService ||
        !needle ||
        (item.name ?? "").toLowerCase().includes(needle),
    )
    .map((item) => ({ value: item.pulp_href ?? "", label: item.name ?? "" }));

  return {
    options,
    isLoading: activeQuery.isFetching,
    selectedLabel: selectedDetail?.name,
  };
};

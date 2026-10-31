import type { ITypeaheadOption } from "@app/components/TypeaheadSelect";
import { DROPDOWN_PAGE_SIZE } from "@app/constants";
import {
  useContentGuardDetailQuery,
  useContentGuardsListQuery,
} from "@app/queries/content-guards";
import {
  type IPublicationListParams,
  usePublicationsListQuery,
} from "@app/queries/publications";
import {
  type IRemoteListParams,
  useRemoteDetailQuery,
  useRemotesListQuery,
} from "@app/queries/remotes";
import {
  type IRepositoryListParams,
  useRepositoriesListQuery,
  useRepositoryDetailQuery,
} from "@app/queries/repositories";
import {
  useSigningServiceDetailQuery,
  useSigningServicesListQuery,
} from "@app/queries/signing-services";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";
import type { ResourceKind } from "@app/utils/entityField";

// A publication's label is its id; only a whole id can be searched (`pulp_id__in`).
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface IResourceSearch {
  options: ITypeaheadOption[];
  isLoading: boolean;
  /** Label for the currently-selected href (may be outside the current page). */
  selectedLabel?: string;
}

interface IUseResourceSearchOptions {
  resourceKind: ResourceKind;
  /** Debounced search text typed into the dropdown. */
  term: string;
  /** The field's current value (href), for resolving its label in edit mode. */
  selectedHref: string;
  /** Gate the list fetch — true only while the dropdown is open (lazy load). */
  enabled: boolean;
  /**
   * Compatible pulp_types (e.g. a repository's remote types), sent as `pulp_type__in`
   * to the kinds that take it (repository, remote, publication); unset offers every type.
   */
  pulpTypes?: string[];
}

/**
 * Server-side typeahead search for one `asyncResource` field: only the query for its
 * `resourceKind` runs, and only while the dropdown is open.
 */
export const useResourceSearch = ({
  resourceKind,
  term,
  selectedHref,
  enabled,
  pulpTypes,
}: IUseResourceSearchOptions): IResourceSearch => {
  const isRepository = resourceKind === "repository";
  const isRemote = resourceKind === "remote";
  const isPublication = resourceKind === "publication";
  const isSigningService = resourceKind === "signingService";
  const isContentGuard = resourceKind === "contentGuard";
  const trimmed = term.trim();
  // An empty list means nothing is compatible; `pulp_type__in=` would match every type.
  const hasTypes = pulpTypes?.length !== 0;

  // Every kind's query is declared (rules of hooks); `enabled` keeps the inactive
  // ones from firing.
  const repositoryQuery = useRepositoriesListQuery({
    params: {
      limit: DROPDOWN_PAGE_SIZE,
      offset: 0,
      ordering: "name",
      name__icontains: trimmed || undefined,
      pulp_type__in: pulpTypes as IRepositoryListParams["pulp_type__in"],
    },
    options: { enabled: enabled && isRepository && hasTypes },
  });
  const remoteQuery = useRemotesListQuery({
    params: {
      limit: DROPDOWN_PAGE_SIZE,
      offset: 0,
      ordering: "name",
      name__icontains: trimmed || undefined,
      pulp_type__in: pulpTypes as IRemoteListParams["pulp_type__in"],
    },
    options: { enabled: enabled && isRemote && hasTypes },
  });
  // Publications have no name: newest first, searchable by a whole id.
  const publicationQuery = usePublicationsListQuery({
    params: {
      limit: DROPDOWN_PAGE_SIZE,
      offset: 0,
      ordering: "-pulp_created",
      pulp_id__in: UUID_PATTERN.test(trimmed) ? [trimmed] : undefined,
      pulp_type__in: pulpTypes as IPublicationListParams["pulp_type__in"],
    },
    options: { enabled: enabled && isPublication && hasTypes },
  });
  // Signing services only filter on the exact `name`.
  const signingServiceQuery = useSigningServicesListQuery({
    params: {
      limit: DROPDOWN_PAGE_SIZE,
      offset: 0,
      ordering: "name",
      name: trimmed || undefined,
    },
    options: { enabled: enabled && isSigningService },
  });
  const contentGuardQuery = useContentGuardsListQuery({
    params: {
      limit: DROPDOWN_PAGE_SIZE,
      offset: 0,
      ordering: "name",
      name__icontains: trimmed || undefined,
    },
    options: { enabled: enabled && isContentGuard },
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
    return {
      options: (publicationQuery.data?.results ?? []).map((pub) => ({
        value: pub.pulp_href ?? "",
        label: pub.pulp_href
          ? `Publication ${extractIdFromHref(pub.pulp_href)}`
          : "",
      })),
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
  const options = items.map((item) => ({
    value: item.pulp_href ?? "",
    label: item.name ?? "",
  }));

  return {
    options,
    isLoading: activeQuery.isFetching,
    selectedLabel: selectedDetail?.name,
  };
};

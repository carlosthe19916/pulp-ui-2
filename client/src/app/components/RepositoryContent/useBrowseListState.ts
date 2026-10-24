import type { ISortBy } from "@patternfly/react-table";
import {
  useDataViewFilters,
  useDataViewPagination,
} from "@patternfly/react-data-view";

import { useColumnSort } from "@app/hooks/useColumnSort";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";

/** A text filter in the toolbar, keyed by the query param it sends (e.g. `name__icontains`). */
export interface IBrowseFilter<TParam extends string = string> {
  param: TParam;
  label: string;
  placeholder?: string;
}

interface IUseBrowseListStateOptions<
  TSort extends string,
  TFilter extends string,
> {
  sort?: {
    keys: readonly TSort[];
    initial: { sortBy: TSort; direction: NonNullable<ISortBy["direction"]> };
  };
  filters?: readonly IBrowseFilter<TFilter>[];
  perPage?: number;
}

/**
 * Paging, column sort and toolbar filters for one Browse list. Returns the state the
 * shared `BrowseShell` renders plus `params` (paging, ordering, debounced filters) that
 * the section spreads into its own query, so the section still owns every param.
 */
export const useBrowseListState = <
  TSort extends string = never,
  TFilter extends string = never,
>({
  sort,
  filters: filterDefs = [],
  perPage = 10,
}: IUseBrowseListStateOptions<TSort, TFilter> = {}) => {
  const pagination = useDataViewPagination({ perPage });
  const { ordering, sortProps } = useColumnSort<TSort>({
    columnKeys: sort?.keys ?? [],
    // With no sort config the key list is empty, so this resolves to "unsorted".
    initialSort: sort?.initial ?? { sortBy: "" as TSort, direction: "asc" },
    onSortChange: () => pagination.onSetPage(undefined, 1),
  });
  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<
    Partial<Record<TFilter, string>>
  >({ initialFilters: {} });
  const debounced = useDebouncedValue({ value: filters });

  const filterParams = Object.fromEntries(
    filterDefs
      .map(({ param }) => [param, debounced[param]] as const)
      .filter(([, value]) => !!value),
  ) as Partial<Record<TFilter, string>>;

  return {
    pagination,
    sortProps,
    filterDefs,
    filters,
    setFilters: (next: Partial<Record<TFilter, string>>) => {
      onSetFilters(next);
      pagination.onSetPage(undefined, 1);
    },
    clearAllFilters,
    isFiltered: Object.keys(filterParams).length > 0,
    params: {
      limit: pagination.perPage,
      offset: (pagination.page - 1) * pagination.perPage,
      ordering: ordering ? [ordering] : undefined,
      ...filterParams,
    },
  };
};

/** The part of the list state the shared toolbar and pagination render. */
export interface IBrowseListView {
  pagination: ReturnType<typeof useDataViewPagination>;
  filterDefs: readonly IBrowseFilter[];
  filters: Record<string, string | undefined>;
  setFilters: (next: Record<string, string | undefined>) => void;
  clearAllFilters: () => void;
  isFiltered: boolean;
}

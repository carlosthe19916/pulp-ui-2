import { z } from "zod";

import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import {
  definePersistentState,
  type IPersistentStateDefinition,
  type PersistentStateSetter,
  usePersistentState,
} from "@app/hooks/usePersistentState";
import {
  defineSortState,
  type ListPaginationState,
  PAGINATION_STATE,
} from "@app/utils/listState";
import { buildThSort, toOrderingParam } from "@app/utils/sortHelpers";

/** A text filter in the toolbar, keyed by the query param it sends (e.g. `name__icontains`). */
export interface IBrowseFilter<TParam extends string = string> {
  param: TParam;
  label: string;
  placeholder?: string;
}

/** A filter's name in the URL: its param without the lookup (`name__icontains` → `name`). */
type FilterField<TParam extends string> =
  TParam extends `${infer Field}__${string}` ? Field : TParam;

const filterField = <TParam extends string>(param: TParam) =>
  param.split("__")[0] as FilterField<TParam>;

/** A toolbar filter with the field it's kept under. */
export interface IBrowseFilterField<
  TParam extends string = string,
> extends IBrowseFilter<TParam> {
  field: FilterField<TParam>;
}

type SortDirection = "asc" | "desc";

type SortDefinition = IPersistentStateDefinition<
  z.ZodObject<{
    sortBy: z.ZodType<string>;
    direction: z.ZodType<SortDirection>;
  }>
>;

type FiltersDefinition = IPersistentStateDefinition<
  z.ZodObject<Record<string, z.ZodString>>
>;

const NO_SORT: SortDefinition = definePersistentState({
  key: "sort",
  schema: z.object({
    sortBy: z.literal(""),
    direction: z.enum(["asc", "desc"]),
  }),
  defaultValue: { sortBy: "", direction: "asc" },
});

/** What one Browse list keeps; build it with `defineBrowseListState` at module scope. */
export interface IBrowseListDefinition<
  TSort extends string,
  TFilter extends string,
> {
  sortKeys: readonly TSort[];
  sort: SortDefinition;
  filterDefs: readonly IBrowseFilterField<TFilter>[];
  filters: FiltersDefinition;
}

/** A Browse list's sortable columns, default sort and toolbar filters; call it at module scope. */
export const defineBrowseListState = <
  const TSort extends string = never,
  const TFilter extends string = never,
>({
  sort,
  filters = [],
}: {
  sort?: {
    columnKeys: readonly [TSort, ...TSort[]];
    defaultValue: { sortBy: NoInfer<TSort>; direction: SortDirection };
  };
  filters?: readonly IBrowseFilter<TFilter>[];
} = {}): IBrowseListDefinition<TSort, TFilter> => {
  const filterDefs = filters.map((filter) => ({
    ...filter,
    field: filterField(filter.param),
  }));
  const fields = filterDefs.map(({ field }) => field);
  return {
    sortKeys: sort?.columnKeys ?? [],
    sort: sort ? defineSortState(sort) : NO_SORT,
    filterDefs,
    filters: definePersistentState({
      key: "filters",
      schema: z.object(
        Object.fromEntries(fields.map((field) => [field, z.string()])),
      ),
      defaultValue: Object.fromEntries(fields.map((field) => [field, ""])),
    }),
  };
};

/**
 * Paging, sort and filters for one Browse list, kept in the URL, plus the `params` the section
 * spreads into its query. The screen scopes each section.
 */
export const useBrowseListState = <
  TSort extends string,
  TFilter extends string,
>(
  definition: IBrowseListDefinition<TSort, TFilter>,
) => {
  const [pagination, setPagination] = usePersistentState({
    ...PAGINATION_STATE,
    storage: "url",
  });
  const toFirstPage = () => setPagination((prev) => ({ ...prev, page: 1 }));

  const [sort, setSort] = usePersistentState({
    ...definition.sort,
    storage: "url",
  });
  // Undefined for a list without sortable columns, so it sends no `ordering`.
  const sortBy = definition.sortKeys.find((key) => key === sort.sortBy);
  const ordering = toOrderingParam({ sortBy, direction: sort.direction });
  const sortProps = (columnKey: TSort) =>
    buildThSort({
      columnKeys: definition.sortKeys,
      columnKey,
      sortBy,
      direction: sort.direction,
      onSort: (_event, next, direction) => {
        setSort({
          sortBy: next,
          direction: direction === "desc" ? "desc" : "asc",
        });
        toFirstPage();
      },
    });

  const [filters, setFilters] = usePersistentState({
    ...definition.filters,
    storage: "url",
  });
  const debounced = useDebouncedValue({ value: filters });
  const filterParams = Object.fromEntries(
    definition.filterDefs
      .map(({ param, field }) => [param, debounced[field]] as const)
      .filter(([, value]) => !!value),
  ) as Partial<Record<TFilter, string>>;

  return {
    pagination,
    setPagination,
    toFirstPage,
    sortProps,
    filterDefs: definition.filterDefs,
    filters,
    setFilters: (next: Partial<Record<string, string>>) => {
      const fields = Object.entries(next).map(([field, value]) => [
        field,
        value ?? "",
      ]);
      setFilters((prev) => ({ ...prev, ...Object.fromEntries(fields) }));
      toFirstPage();
    },
    clearAllFilters: () => {
      setFilters(definition.filters.defaultValue);
      toFirstPage();
    },
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
  pagination: ListPaginationState;
  setPagination: PersistentStateSetter<ListPaginationState>;
  filterDefs: readonly IBrowseFilterField[];
  filters: Record<string, string>;
  setFilters: (next: Partial<Record<string, string>>) => void;
  clearAllFilters: () => void;
  isFiltered: boolean;
}

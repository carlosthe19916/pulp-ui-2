import type React from "react";

import type {
  OnPerPageSelect,
  OnSetPage,
  PaginationVariant,
  PerPageOptions,
} from "@patternfly/react-core";
import { Pagination } from "@patternfly/react-core";

import {
  isPerPage,
  type ListPaginationState,
  PER_PAGE_VALUES,
} from "@app/utils/listState";

/**
 * Per-page choices for every list built on `ListPagination`. Capping at 20 bounds
 * the per-row task probe fan-out on probe lists (`useResourceTasks`: domains,
 * repositories, remotes, distributions) — without it PatternFly's default menu
 * offers 100, which is 100 polling `tasks/?limit=1` requests per refetch.
 */
const PER_PAGE_OPTIONS: PerPageOptions[] = PER_PAGE_VALUES.map((value) => ({
  title: String(value),
  value,
}));

/** `useDataViewPagination` state, which carries its own handlers. */
interface IDataViewPagination {
  page: number;
  perPage: number;
  onSetPage: OnSetPage;
  onPerPageSelect: OnPerPageSelect;
}

type IListPaginationProps = {
  variant: PaginationVariant;
  itemCount: number;
} & (
  | { pagination: IDataViewPagination; onPaginationChange?: never }
  | {
      pagination: ListPaginationState;
      onPaginationChange: (next: ListPaginationState) => void;
    }
);

/** Standard list `<Pagination>` wiring, so list pages don't each repeat it. */
export const ListPagination: React.FC<IListPaginationProps> = ({
  variant,
  itemCount,
  pagination,
  onPaginationChange,
}) => (
  <Pagination
    variant={variant}
    itemCount={itemCount}
    page={pagination.page}
    perPage={pagination.perPage}
    onSetPage={
      "onSetPage" in pagination
        ? pagination.onSetPage
        : (_event, page) => onPaginationChange?.({ ...pagination, page })
    }
    onPerPageSelect={
      "onPerPageSelect" in pagination
        ? pagination.onPerPageSelect
        : (_event, perPage) =>
            // Only PER_PAGE_OPTIONS are offered, so the guard never drops a choice.
            isPerPage(perPage) && onPaginationChange?.({ page: 1, perPage })
    }
    perPageOptions={PER_PAGE_OPTIONS}
  />
);

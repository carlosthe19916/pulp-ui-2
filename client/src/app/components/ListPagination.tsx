import type React from "react";

import type {
  OnPerPageSelect,
  OnSetPage,
  PaginationVariant,
  PerPageOptions,
} from "@patternfly/react-core";
import { Pagination } from "@patternfly/react-core";

/**
 * Per-page choices for every list built on `ListPagination`. Capping at 20 bounds
 * the per-row task probe fan-out on probe lists (`useResourceTasks`: domains,
 * repositories, remotes, distributions) — without it PatternFly's default menu
 * offers 100, which is 100 polling `tasks/?limit=1` requests per refetch.
 */
const PER_PAGE_OPTIONS: PerPageOptions[] = [
  { title: "10", value: 10 },
  { title: "20", value: 20 },
];

interface IListPaginationProps {
  variant: PaginationVariant;
  itemCount: number;
  /** The `useDataViewPagination` state (page/perPage + handlers). */
  pagination: {
    page: number;
    perPage: number;
    onSetPage: OnSetPage;
    onPerPageSelect: OnPerPageSelect;
  };
}

/** Standard list `<Pagination>` wiring, so list pages don't each repeat it. */
export const ListPagination: React.FC<IListPaginationProps> = ({
  variant,
  itemCount,
  pagination,
}) => (
  <Pagination
    variant={variant}
    itemCount={itemCount}
    page={pagination.page}
    perPage={pagination.perPage}
    onSetPage={pagination.onSetPage}
    onPerPageSelect={pagination.onPerPageSelect}
    perPageOptions={PER_PAGE_OPTIONS}
  />
);

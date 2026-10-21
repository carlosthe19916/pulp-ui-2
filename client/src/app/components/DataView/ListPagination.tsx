import type React from "react";

import { Pagination } from "@patternfly/react-core";
import type {
  OnSetPage,
  OnPerPageSelect,
  PaginationVariant,
  PerPageOptions,
} from "@patternfly/react-core";

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
  /** Override the per-page menu (defaults to PatternFly's 10/20/50/100). */
  perPageOptions?: PerPageOptions[];
}

/** Standard list `<Pagination>` wiring, so list pages don't each repeat it. */
export const ListPagination: React.FC<IListPaginationProps> = ({
  variant,
  itemCount,
  pagination,
  perPageOptions,
}) => (
  <Pagination
    variant={variant}
    itemCount={itemCount}
    page={pagination.page}
    perPage={pagination.perPage}
    onSetPage={pagination.onSetPage}
    onPerPageSelect={pagination.onPerPageSelect}
    perPageOptions={perPageOptions}
  />
);

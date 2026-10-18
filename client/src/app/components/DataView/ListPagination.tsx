import type React from "react";

import { Pagination } from "@patternfly/react-core";
import type {
  OnSetPage,
  OnPerPageSelect,
  PaginationVariant,
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
  />
);

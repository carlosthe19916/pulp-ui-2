import type React from "react";

import {
  Bullseye,
  DataList,
  DataListCell,
  DataListItem,
  DataListItemCells,
  DataListItemRow,
} from "@patternfly/react-core";

import { LoadingWrapper } from "@app/components/LoadingWrapper";
import { TableEmptyState } from "@app/components/TableEmptyState";
import type { DrfAxiosError } from "@app/queries/utils/openapiErrorTypes";

import { BrowseShell } from "./BrowseShell";
import type { IBrowseListView } from "./useBrowseListState";

interface IBrowseDataListProps<T> {
  ariaLabel: string;
  list: IBrowseListView;
  rows: T[];
  count: number;
  isLoading: boolean;
  error: DrfAxiosError | null;
  rowHref: (row: T) => string;
  renderRow: (row: T) => React.ReactNode;
  emptyTitle: string;
  selectedHref?: string;
  onSelect: (href: string) => void;
}

/** A Browse list as rich rows (Galaxy-style cards); selecting a row opens the drawer. */
export const BrowseDataList = <T,>({
  ariaLabel,
  list,
  rows,
  count,
  isLoading,
  error,
  rowHref,
  renderRow,
  emptyTitle,
  selectedHref,
  onSelect,
}: IBrowseDataListProps<T>) => (
  <BrowseShell list={list} count={count}>
    <LoadingWrapper isFetching={isLoading} fetchError={error}>
      {rows.length === 0 ? (
        <Bullseye>
          <TableEmptyState
            title={emptyTitle}
            isFiltered={list.isFiltered}
            onClearFilters={list.clearAllFilters}
          />
        </Bullseye>
      ) : (
        <DataList
          aria-label={ariaLabel}
          selectedDataListItemId={selectedHref}
          onSelectDataListItem={(_event, id) => onSelect(id)}
        >
          {rows.map((row) => {
            const href = rowHref(row);
            return (
              <DataListItem key={href} id={href}>
                <DataListItemRow>
                  <DataListItemCells
                    dataListCells={[
                      <DataListCell key="row">{renderRow(row)}</DataListCell>,
                    ]}
                  />
                </DataListItemRow>
              </DataListItem>
            );
          })}
        </DataList>
      )}
    </LoadingWrapper>
  </BrowseShell>
);

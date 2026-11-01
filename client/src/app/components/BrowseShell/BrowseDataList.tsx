import type React from "react";

import {
  Bullseye,
  DataList,
  DataListCell,
  DataListCheck,
  DataListItem,
  DataListItemCells,
  DataListItemRow,
} from "@patternfly/react-core";

import { LoadingWrapper } from "@app/components/LoadingWrapper";
import { TableEmptyState } from "@app/components/TableEmptyState";
import {
  type IContentWrites,
  useContentUnitSelection,
} from "@app/hooks/useContentUnitSelection";
import type { DrfAxiosError } from "@app/queries/utils/openapiErrorTypes";
import { toUnitRefs } from "@app/utils/contentUnitLabel";

import { BrowseShell } from "./BrowseShell";
import type { IBrowseListView } from "./useBrowseListState";

interface IBrowseDataListProps<T> {
  ariaLabel: string;
  list: IBrowseListView;
  rows: T[];
  /** The list's total; `undefined` while it loads. */
  count: number | undefined;
  isLoading: boolean;
  error: DrfAxiosError | null;
  rowHref: (row: T) => string;
  renderRow: (row: T) => React.ReactNode;
  emptyTitle: string;
  selectedHref?: string;
  onSelect: (href: string) => void;
  /** Bulk selection + Remove. */
  writes?: IContentWrites;
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
  writes,
}: IBrowseDataListProps<T>) => {
  const selection = useContentUnitSelection();
  const pageUnits = toUnitRefs({ rows, rowHref });

  return (
    <BrowseShell
      list={list}
      count={count}
      writes={writes}
      selection={selection}
      pageUnits={pageUnits}
    >
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
              const unit = pageUnits.find((ref) => ref.href === href);
              return (
                <DataListItem key={href} id={href}>
                  <DataListItemRow>
                    {writes && unit && (
                      <DataListCheck
                        id={`${href}-check`}
                        aria-labelledby={`${href}-cell`}
                        isChecked={selection.isSelected(href)}
                        isDisabled={writes.isLocked}
                        onChange={(_event, checked) =>
                          selection.setUnits({
                            units: [unit],
                            isSelecting: checked,
                          })
                        }
                      />
                    )}
                    <DataListItemCells
                      dataListCells={[
                        <DataListCell key="row" id={`${href}-cell`}>
                          {renderRow(row)}
                        </DataListCell>,
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
};

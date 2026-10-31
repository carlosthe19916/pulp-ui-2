import type React from "react";

import { DataViewTable, type DataViewTr } from "@patternfly/react-data-view";
import type { ThProps } from "@patternfly/react-table";

import { dataViewBodyStates } from "@app/components/dataViewStates";
import { TableEmptyState } from "@app/components/TableEmptyState";
import {
  type IContentWrites,
  useContentUnitSelection,
} from "@app/hooks/useContentUnitSelection";
import type { DrfAxiosError } from "@app/queries/utils/openapiErrorTypes";
import { toUnitRefs } from "@app/utils/contentUnitLabel";
import type { DataViewTh } from "@app/utils/dataViewTypes";

import { groupStarts } from "./browseHelpers";
import { BrowseShell } from "./BrowseShell";
import type { IBrowseListView } from "./useBrowseListState";

/** A click on a row's checkbox, link or button shouldn't also open the drawer. */
const isControlClick = (event?: React.SyntheticEvent) =>
  event?.target instanceof Element &&
  !!event.target.closest("input, label, a, button");

export interface IBrowseColumn<T> {
  title: string;
  cell: (row: T) => React.ReactNode;
  /** From the list state's `sortProps(key)` when the column is sortable. */
  sort?: ThProps["sort"];
  width?: ThProps["width"];
  isTruncated?: boolean;
  /** Accessible name for a column with an empty title (e.g. an icon-only action). */
  screenReaderText?: string;
}

interface IBrowseTableProps<T> {
  ariaLabel: string;
  list: IBrowseListView;
  rows: T[];
  count: number;
  isLoading: boolean;
  error: DrfAxiosError | null;
  columns: IBrowseColumn<T>[];
  /** The content href a row opens in the drawer; omit for rows that can't be opened. */
  rowHref?: (row: T) => string | undefined;
  /** For rows that aren't content themselves (e.g. a Maven artifact): resolve and open on click. */
  onRowClick?: (row: T) => void;
  isRowSelected?: (row: T) => boolean;
  /** Blanks the first column while it repeats the previous row's group key. */
  groupBy?: (row: T) => string;
  emptyTitle: string;
  header?: React.ReactNode;
  selectedHref?: string;
  onSelect: (href: string) => void;
  /** Bulk selection + Remove; only rows with a `rowHref` can be selected. */
  writes?: IContentWrites;
}

/** A Browse list as a table: sortable columns, clickable rows that open the drawer. */
export const BrowseTable = <T,>({
  ariaLabel,
  list,
  rows,
  count,
  isLoading,
  error,
  columns,
  rowHref,
  onRowClick,
  isRowSelected,
  groupBy,
  emptyTitle,
  header,
  selectedHref,
  onSelect,
  writes,
}: IBrowseTableProps<T>) => {
  const starts = groupBy ? groupStarts({ rows, groupBy }) : [];
  const selection = useContentUnitSelection();
  const pageUnits = toUnitRefs({ rows, rowHref });

  const thead: DataViewTh[] = columns.map((column) => ({
    cell: column.title,
    props: {
      sort: column.sort,
      width: column.width,
      screenReaderText: column.screenReaderText,
    },
  }));

  const tbody: DataViewTr[] = rows.map((row, index) => {
    const href = rowHref?.(row);
    return {
      id: href ?? String(index),
      row: columns.map((column, columnIndex) => ({
        cell:
          groupBy && columnIndex === 0 && !starts[index]
            ? ""
            : column.cell(row),
        props: {
          dataLabel: column.title,
          modifier: column.isTruncated ? "truncate" : undefined,
        },
      })),
      props: href
        ? {
            isClickable: true,
            isRowSelected: href === selectedHref,
            onRowClick: (event?: React.SyntheticEvent) => {
              if (!isControlClick(event)) onSelect(href);
            },
          }
        : onRowClick
          ? {
              isClickable: true,
              isRowSelected: isRowSelected?.(row),
              onRowClick: () => onRowClick(row),
            }
          : undefined,
    };
  });

  const { activeState, bodyStates } = dataViewBodyStates({
    columnCount: columns.length,
    hasSelectionColumn: !!writes,
    loadingRows: list.pagination.perPage,
    isLoading,
    error,
    isEmpty: rows.length === 0,
    emptyState: (
      <TableEmptyState
        title={emptyTitle}
        isFiltered={list.isFiltered}
        onClearFilters={list.clearAllFilters}
      />
    ),
  });

  return (
    <BrowseShell
      list={list}
      count={count}
      activeState={activeState}
      header={header}
      writes={writes}
      selection={selection}
      pageUnits={pageUnits}
    >
      <DataViewTable
        aria-label={ariaLabel}
        columns={thead}
        rows={tbody}
        bodyStates={bodyStates}
      />
    </BrowseShell>
  );
};

import type React from "react";

import { PaginationVariant } from "@patternfly/react-core";
import {
  DataView,
  DataViewFilters,
  DataViewTextFilter,
  DataViewToolbar,
  type DataViewState,
} from "@patternfly/react-data-view";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import {
  ContentBulkSelect,
  RemoveSelectedButton,
} from "@app/components/ContentBulkSelect";
import { ListPagination } from "@app/components/DataView";
import {
  dataViewSelection,
  type IContentUnitRef,
  type IContentUnitSelection,
  type IContentWrites,
} from "@app/hooks/useContentUnitSelection";

import type { IBrowseListView } from "./useBrowseListState";

interface IBrowseShellProps {
  list: IBrowseListView;
  count: number;
  activeState?: DataViewState;
  /** Shown above the toolbar, e.g. a path breadcrumb. */
  header?: React.ReactNode;
  /** Bulk selection + Remove; absent when the list is read-only. */
  writes?: IContentWrites;
  selection: IContentUnitSelection;
  /** The units on the current page. */
  pageUnits: IContentUnitRef[];
  children: React.ReactNode;
}

/**
 * Toolbar (bulk select, filters, Remove, pagination), body, bottom pagination: the
 * frame of every Browse list.
 */
export const BrowseShell: React.FC<IBrowseShellProps> = ({
  list,
  count,
  activeState,
  header,
  writes,
  selection,
  pageUnits,
  children,
}) => (
  <DataView
    activeState={activeState}
    selection={
      writes
        ? dataViewSelection({
            selection,
            units: pageUnits,
            isSelectDisabled: () => writes.isLocked,
          })
        : undefined
    }
  >
    {header ? <div className={spacing.mbMd}>{header}</div> : null}
    <DataViewToolbar
      bulkSelect={
        writes ? (
          <ContentBulkSelect
            pageUnits={pageUnits}
            selection={selection}
            isDisabled={writes.isLocked}
          />
        ) : undefined
      }
      actions={
        writes ? (
          <RemoveSelectedButton selection={selection} writes={writes} />
        ) : undefined
      }
      clearAllFilters={
        list.filterDefs.length ? list.clearAllFilters : undefined
      }
      filters={
        list.filterDefs.length ? (
          <DataViewFilters
            onChange={(_key, next) => list.setFilters(next)}
            values={list.filters}
          >
            {list.filterDefs.map((filter) => (
              <DataViewTextFilter
                key={filter.param}
                filterId={filter.param}
                title={filter.label}
                placeholder={filter.placeholder}
              />
            ))}
          </DataViewFilters>
        ) : undefined
      }
      pagination={
        <ListPagination
          variant={PaginationVariant.top}
          itemCount={count}
          pagination={list.pagination}
        />
      }
    />
    {children}
    <DataViewToolbar
      pagination={
        <ListPagination
          variant={PaginationVariant.bottom}
          itemCount={count}
          pagination={list.pagination}
        />
      }
    />
  </DataView>
);

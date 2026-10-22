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

import { ListPagination } from "@app/components/DataView";

import type { IBrowseListView } from "./useBrowseListState";

interface IBrowseShellProps {
  list: IBrowseListView;
  count: number;
  activeState?: DataViewState;
  /** Shown above the toolbar, e.g. a path breadcrumb. */
  header?: React.ReactNode;
  children: React.ReactNode;
}

/** Toolbar (filters + pagination), body, bottom pagination: the frame of every Browse list. */
export const BrowseShell: React.FC<IBrowseShellProps> = ({
  list,
  count,
  activeState,
  header,
  children,
}) => (
  <DataView activeState={activeState}>
    {header ? <div className={spacing.mbMd}>{header}</div> : null}
    <DataViewToolbar
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

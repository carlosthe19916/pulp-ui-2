import type React from "react";

import { Link } from "@tanstack/react-router";

import {
  Content,
  ContentVariants,
  PageSection,
  PaginationVariant,
} from "@patternfly/react-core";
import {
  DataView,
  DataViewFilters,
  DataViewTable,
  DataViewTextFilter,
  DataViewToolbar,
  type DataViewTr,
} from "@patternfly/react-data-view";

import { dataViewBodyStates } from "@app/components/dataViewStates";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { DomainContextSelector } from "@app/components/DomainContextSelector";
import { ListPagination } from "@app/components/ListPagination";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { usePersistentState } from "@app/hooks/usePersistentState";
import { useTaskSchedulesListQuery } from "@app/queries/task-schedules";
import type { DataViewTh } from "@app/utils/dataViewTypes";
import { columnSort } from "@app/utils/sortHelpers";
import {
  extractTaskDomain,
  extractTaskId,
  shortTaskName,
} from "@app/utils/taskHref";
import { formatDateTime } from "@app/utils/utils";

import {
  SORTABLE_COLUMN_KEYS,
  TASK_SCHEDULE_LIST_STATE,
} from "./taskScheduleListState";

/** Tasks Pulp dispatches on a schedule (read-only; plugins define them). */
export const TaskScheduleList: React.FC = () => {
  const [pagination, setPagination] = usePersistentState({
    ...TASK_SCHEDULE_LIST_STATE.pagination,
    storage: "url",
  });
  const toFirstPage = () => setPagination((prev) => ({ ...prev, page: 1 }));

  const [sort, setSort] = usePersistentState({
    ...TASK_SCHEDULE_LIST_STATE.sort,
    storage: "url",
  });
  const { ordering, sortProps } = columnSort({
    columnKeys: SORTABLE_COLUMN_KEYS,
    sort,
    onSort: (next) => {
      setSort(next);
      toFirstPage();
    },
  });

  const [filters, setFilters] = usePersistentState({
    ...TASK_SCHEDULE_LIST_STATE.filters,
    storage: "url",
  });
  const clearAllFilters = () => {
    setFilters(TASK_SCHEDULE_LIST_STATE.filters.defaultValue);
    toFirstPage();
  };
  const debouncedName = useDebouncedValue({ value: filters.name });
  const { data, isLoading, error } = useTaskSchedulesListQuery({
    params: {
      limit: pagination.perPage,
      offset: (pagination.page - 1) * pagination.perPage,
      ordering,
      name__contains: debouncedName || undefined,
    },
  });

  const schedules = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const columns: DataViewTh[] = [
    { cell: "Name", props: { sort: sortProps("name"), width: 25 } },
    { cell: "Task", props: { sort: sortProps("task_name"), width: 30 } },
    { cell: "Interval", props: { width: 15 } },
    {
      cell: "Next dispatch",
      props: { sort: sortProps("next_dispatch"), width: 15 },
    },
    { cell: "Last task", props: { width: 15 } },
  ];
  const rows: DataViewTr[] = schedules.map((schedule) => ({
    id: schedule.pulp_href,
    row: [
      { cell: schedule.name, props: { dataLabel: "Name" } },
      {
        cell: shortTaskName(schedule.task_name),
        props: { dataLabel: "Task" },
      },
      {
        cell: schedule.dispatch_interval ?? "Once",
        props: { dataLabel: "Interval" },
      },
      {
        cell: formatDateTime(schedule.next_dispatch) ?? "—",
        props: { dataLabel: "Next dispatch" },
      },
      {
        cell: schedule.last_task ? (
          <Link
            to="/monitoring/$pulpDomain/tasks/$taskId"
            params={{
              pulpDomain: extractTaskDomain(schedule.last_task),
              taskId: extractTaskId(schedule.last_task),
            }}
          >
            {extractTaskId(schedule.last_task)}
          </Link>
        ) : (
          "—"
        ),
        props: { dataLabel: "Last task" },
      },
    ],
  }));

  const { activeState, bodyStates } = dataViewBodyStates({
    columnCount: columns.length,
    isLoading,
    error,
    isEmpty: schedules.length === 0,
    emptyState: (
      <TableEmptyState
        title="No task schedules"
        isFiltered={!!debouncedName}
        onClearFilters={clearAllFilters}
      />
    ),
  });

  return (
    <>
      <DocumentTitle title="Task schedules" />
      <DomainContextSelector />
      <PageSection>
        <Content component={ContentVariants.h1}>Task schedules</Content>
        <Content component={ContentVariants.p}>
          Tasks Pulp dispatches on a schedule.
        </Content>
      </PageSection>
      <PageSection>
        <DataView activeState={activeState}>
          <DataViewToolbar
            clearAllFilters={clearAllFilters}
            filters={
              <DataViewFilters
                onChange={(_key, newFilters) => {
                  setFilters((prev) => ({ ...prev, ...newFilters }));
                  toFirstPage();
                }}
                values={filters}
              >
                <DataViewTextFilter filterId="name" title="Name" />
              </DataViewFilters>
            }
            pagination={
              <ListPagination
                variant={PaginationVariant.top}
                itemCount={totalCount}
                pagination={pagination}
                onPaginationChange={setPagination}
              />
            }
          />
          <DataViewTable
            aria-label="Task schedules table"
            columns={columns}
            rows={rows}
            bodyStates={bodyStates}
          />
          <DataViewToolbar
            pagination={
              <ListPagination
                variant={PaginationVariant.bottom}
                itemCount={totalCount}
                pagination={pagination}
                onPaginationChange={setPagination}
              />
            }
          />
        </DataView>
      </PageSection>
    </>
  );
};

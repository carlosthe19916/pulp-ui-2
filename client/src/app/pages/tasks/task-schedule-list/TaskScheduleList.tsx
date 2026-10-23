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
  useDataViewFilters,
  useDataViewPagination,
  type DataViewTr,
} from "@patternfly/react-data-view";

import {
  dataViewBodyStates,
  ListPagination,
  useColumnSort,
  type DataViewTh,
} from "@app/components/DataView";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { DomainContextSelector } from "@app/components/DomainContextSelector";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import {
  type ITaskScheduleListParams,
  useTaskSchedulesListQuery,
} from "@app/queries/task-schedules";
import type { OrderingField } from "@app/queries/utils/listParams";
import {
  extractTaskDomain,
  extractTaskId,
  shortTaskName,
} from "@app/utils/taskHref";
import { formatDateTime } from "@app/utils/utils";

const SORTABLE_COLUMN_KEYS = [
  "name",
  "task_name",
  "next_dispatch",
] as const satisfies readonly OrderingField<ITaskScheduleListParams>[];

interface IScheduleFilters {
  name: string;
}

/** Tasks Pulp dispatches on a schedule (read-only; plugins define them). */
export const TaskScheduleList: React.FC = () => {
  const pagination = useDataViewPagination({ perPage: 10 });
  const { ordering, sortProps } = useColumnSort({
    columnKeys: SORTABLE_COLUMN_KEYS,
    initialSort: { sortBy: "next_dispatch", direction: "asc" },
    onSortChange: () => pagination.onSetPage(undefined, 1),
  });
  const { filters, onSetFilters, clearAllFilters } =
    useDataViewFilters<IScheduleFilters>({ initialFilters: { name: "" } });
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
    { cell: "Name", props: { sort: sortProps("name") } },
    { cell: "Task", props: { sort: sortProps("task_name") } },
    { cell: "Interval" },
    { cell: "Next dispatch", props: { sort: sortProps("next_dispatch") } },
    { cell: "Last task" },
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
                  onSetFilters(newFilters);
                  pagination.onSetPage(undefined, 1);
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
              />
            }
          />
        </DataView>
      </PageSection>
    </>
  );
};

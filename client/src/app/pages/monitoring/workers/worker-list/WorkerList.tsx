import type React from "react";
import { useState } from "react";

import {
  Content,
  ContentVariants,
  Label,
  MenuToggle,
  type MenuToggleElement,
  PageSection,
  PaginationVariant,
  Select,
  SelectList,
  SelectOption,
  ToolbarFilter,
} from "@patternfly/react-core";
import {
  DataView,
  DataViewFilters,
  DataViewTable,
  DataViewTextFilter,
  DataViewToolbar,
  type DataViewTr,
  type ExpandableContent,
} from "@patternfly/react-data-view";

import { dataViewBodyStates } from "@app/components/dataViewStates";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { ListPagination } from "@app/components/ListPagination";
import { RevealCellOnExpand } from "@app/components/RevealCellOnExpand";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { usePersistentState } from "@app/hooks/usePersistentState";
import { useWorkersListQuery } from "@app/queries/workers";
import type { DataViewTh } from "@app/utils/dataViewTypes";
import { columnSort } from "@app/utils/sortHelpers";
import { formatDateTime } from "@app/utils/utils";

import { CurrentTaskLink } from "./components/CurrentTaskLink";
import { WorkerDetails } from "./components/WorkerDetails";
import {
  isWorkerStatusFilter,
  SORTABLE_COLUMN_KEYS,
  WORKER_LIST_STATE,
  type WorkerStatusFilter,
} from "./workerListState";

const STATUS_OPTIONS = [
  { value: "", label: "All workers" },
  { value: "online", label: "Online" },
  { value: "missing", label: "Missing" },
] as const satisfies readonly { value: WorkerStatusFilter; label: string }[];

export const WorkerList: React.FC = () => {
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  const [pagination, setPagination] = usePersistentState({
    ...WORKER_LIST_STATE.pagination,
    storage: "url",
  });
  const toFirstPage = () => setPagination((prev) => ({ ...prev, page: 1 }));

  const [sort, setSort] = usePersistentState({
    ...WORKER_LIST_STATE.sort,
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
    ...WORKER_LIST_STATE.filters,
    storage: "url",
  });
  const clearAllFilters = () => {
    setFilters(WORKER_LIST_STATE.filters.defaultValue);
    toFirstPage();
  };
  const debouncedName = useDebouncedValue({ value: filters.name });

  const statusFilter = filters.status;
  const setStatusFilter = (status: WorkerStatusFilter) => {
    setFilters((prev) => ({ ...prev, status }));
    toFirstPage();
  };

  const { data, isLoading, error } = useWorkersListQuery({
    params: {
      limit: pagination.perPage,
      offset: (pagination.page - 1) * pagination.perPage,
      ordering,
      name__icontains: debouncedName || undefined,
      online: statusFilter === "online" ? true : undefined,
      missing: statusFilter === "missing" ? true : undefined,
    },
  });

  const workers = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  // The response has no TTL to judge a heartbeat by; ask the server which rows are missing.
  const pageHrefs = workers.flatMap((worker) =>
    worker.pulp_href ? [worker.pulp_href] : [],
  );
  const { data: missing } = useWorkersListQuery({
    params: {
      limit: pageHrefs.length,
      pulp_href__in: pageHrefs,
      missing: true,
      fields: ["pulp_href"],
    },
    options: { enabled: pageHrefs.length > 0 },
  });
  const missingHrefs = new Set(
    (missing?.results ?? []).map((worker) => worker.pulp_href),
  );

  const columns: DataViewTh[] = [
    { cell: "Name", props: { sort: sortProps("name"), width: 25 } },
    { cell: "Status", props: { width: 10 } },
    { cell: "Current task", props: { width: 25 } },
    {
      cell: "Last heartbeat",
      props: { sort: sortProps("last_heartbeat"), width: 20 },
    },
    { cell: "Started", props: { sort: sortProps("pulp_created"), width: 20 } },
  ];

  const rows: DataViewTr[] = workers.map((worker) => ({
    id: worker.pulp_href,
    row: [
      {
        cell: worker.name,
        props: { dataLabel: "Name", modifier: "truncate" },
      },
      {
        cell: missingHrefs.has(worker.pulp_href) ? (
          <Label color="orange" isCompact>
            Missing
          </Label>
        ) : (
          <Label color="green" isCompact>
            Online
          </Label>
        ),
        props: { dataLabel: "Status" },
      },
      {
        cell: worker.current_task ? (
          <CurrentTaskLink href={worker.current_task} />
        ) : (
          "Idle"
        ),
        props: { dataLabel: "Current task" },
      },
      {
        cell: formatDateTime(worker.last_heartbeat) ?? "—",
        props: { dataLabel: "Last heartbeat" },
      },
      {
        cell: formatDateTime(worker.pulp_created) ?? "—",
        props: { dataLabel: "Started" },
      },
    ],
  }));

  const expandedRows: ExpandableContent[] = workers.map((worker) => ({
    rowId: worker.pulp_href ?? "",
    columnId: 0,
    content: (
      <RevealCellOnExpand>
        {() => <WorkerDetails worker={worker} />}
      </RevealCellOnExpand>
    ),
  }));

  const { activeState, bodyStates } = dataViewBodyStates({
    columnCount: columns.length,
    isLoading,
    error,
    isEmpty: workers.length === 0,
    emptyState: (
      <TableEmptyState
        title="No workers found"
        body="No task worker is running. Tasks wait until a worker starts."
        isFiltered={Boolean(debouncedName || statusFilter)}
        onClearFilters={clearAllFilters}
      />
    ),
  });

  const statusLabel = STATUS_OPTIONS.find(
    (o) => o.value === statusFilter,
  )?.label;

  // A ToolbarFilter (not a plain item) so the choice shows as a chip and the
  // toolbar's "Clear filters" appears for it too.
  const statusSelect = (
    <ToolbarFilter
      categoryName="Status"
      labels={statusFilter && statusLabel ? [statusLabel] : []}
      deleteLabel={() => setStatusFilter("")}
    >
      <Select
        isOpen={isStatusOpen}
        selected={statusFilter}
        onSelect={(_e, value) => {
          const next = String(value ?? "");
          setStatusFilter(isWorkerStatusFilter(next) ? next : "");
          setIsStatusOpen(false);
        }}
        onOpenChange={setIsStatusOpen}
        toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
          <MenuToggle
            ref={toggleRef}
            onClick={() => setIsStatusOpen(!isStatusOpen)}
            isExpanded={isStatusOpen}
          >
            {statusLabel}
          </MenuToggle>
        )}
      >
        <SelectList>
          {STATUS_OPTIONS.map((o) => (
            <SelectOption key={o.value || "all"} value={o.value}>
              {o.label}
            </SelectOption>
          ))}
        </SelectList>
      </Select>
    </ToolbarFilter>
  );

  return (
    <>
      <DocumentTitle title="Workers" />
      <PageSection>
        <Content component={ContentVariants.h1}>Workers</Content>
        <Content component={ContentVariants.p}>
          Workers run Pulp&apos;s tasks. A worker that stops sending heartbeats
          is shown as missing until the other workers clean it up. Expand a row
          to see the versions of the components it runs.
        </Content>
      </PageSection>
      <PageSection>
        <DataView activeState={activeState}>
          <DataViewToolbar
            clearAllFilters={clearAllFilters}
            filters={
              <>
                <DataViewFilters
                  onChange={(_key, newFilters) => {
                    setFilters((prev) => ({ ...prev, ...newFilters }));
                    toFirstPage();
                  }}
                  values={filters}
                >
                  <DataViewTextFilter filterId="name" title="Name" />
                </DataViewFilters>
                {statusSelect}
              </>
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
            aria-label="Workers table"
            columns={columns}
            rows={rows}
            bodyStates={bodyStates}
            isExpandable
            expandedRows={expandedRows}
            indexBy="id"
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

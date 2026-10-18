import type React from "react";
import { useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import {
  Content,
  ContentVariants,
  Button,
  Label,
  PageSection,
  PaginationVariant,
} from "@patternfly/react-core";
import { ActionsColumn } from "@patternfly/react-table";
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

import type { DomainResponse } from "@app/client";
import { DEFAULT_PULP_DOMAIN } from "@app/Constants";
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import {
  dataViewBodyStates,
  useColumnSort,
  type DataViewTh,
  ListPagination,
} from "@app/components/DataView";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { resourceTaskExpansions } from "@app/components/resourceTaskExpansions";
import { ResourceTaskStatus } from "@app/components/ResourceTaskStatus";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { useNotifications } from "@app/context/useNotifications";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { useResourceTasks } from "@app/hooks/useResourceTasks";
import type { IDomainListParams } from "@app/queries/domains";
import {
  domainKeys,
  useDomainDeleteMutation,
  useDomainsListQuery,
} from "@app/queries/domains";
import type { OrderingField } from "@app/queries/utils/listParams";
import { notifyTaskStarted } from "@app/utils/taskNotify";
import { formatDateTime, getMutationErrorMessage } from "@app/utils/utils";

import { DomainModal } from "./components/DomainModal";
import { storageClassLabel } from "./storageBackends";

const SORTABLE_COLUMN_KEYS = [
  "name",
  "description",
  "storage_class",
  "pulp_created",
] as const satisfies readonly OrderingField<IDomainListParams>[];

interface IDomainFilters {
  name: IDomainListParams["name"];
}

const YesNoLabel: React.FC<{ value?: boolean }> = ({ value }) => (
  <Label color={value ? "green" : "grey"} isCompact>
    {value ? "Yes" : "No"}
  </Label>
);

export const DomainList: React.FC = () => {
  const { addNotification } = useNotifications();
  const queryClient = useQueryClient();

  const [modalState, setModalState] = useState<
    "create" | DomainResponse | null
  >(null);
  const domainToEdit =
    modalState === "create" ? undefined : (modalState ?? undefined);
  const [deleteTarget, setDeleteTarget] = useState<DomainResponse | null>(null);

  const deleteMutation = useDomainDeleteMutation({
    onSuccess: (data, { name }) =>
      notifyTaskStarted({
        addNotification,
        taskHref: data.task,
        title: `Domain "${name}" deletion started`,
      }),
    onError: (error, { name }) =>
      addNotification({
        ...getMutationErrorMessage({
          error,
          fallback: `Failed to delete domain "${name}"`,
        }),
        variant: "danger",
      }),
  });
  const isDeleting = deleteMutation.isPending;

  const pagination = useDataViewPagination({ perPage: 10 });

  const { ordering, sortProps } = useColumnSort({
    columnKeys: SORTABLE_COLUMN_KEYS,
    initialSort: { sortBy: "name", direction: "asc" },
    onSortChange: () => pagination.onSetPage(undefined, 1),
  });

  const { filters, onSetFilters, clearAllFilters } =
    useDataViewFilters<IDomainFilters>({});
  const debouncedName = useDebouncedValue({ value: filters.name });

  const { data, isLoading, error } = useDomainsListQuery({
    params: {
      limit: pagination.perPage,
      offset: (pagination.page - 1) * pagination.perPage,
      ordering,
      name__icontains: debouncedName || undefined,
    },
  });

  const domains = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  const STATUS_COLUMN_INDEX = 6;
  const { getActiveCount, getTaskKinds } = useResourceTasks({
    entities: domains,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: domainKeys.list() });
    },
  });

  const columns: DataViewTh[] = [
    { cell: "Name", props: { sort: sortProps("name"), width: 20 } },
    {
      cell: "Description",
      props: { sort: sortProps("description"), width: 25 },
    },
    { cell: "Storage", props: { sort: sortProps("storage_class"), width: 15 } },
    { cell: "Redirect", props: { width: 10 } },
    { cell: "Hide guarded", props: { width: 15 } },
    { cell: "Created", props: { sort: sortProps("pulp_created"), width: 15 } },
    { cell: "Status" },
    { cell: "", props: { screenReaderText: "Actions" } },
  ];

  const rows: DataViewTr[] = domains.map((domain) => {
    // Pulp forbids editing or deleting the default domain.
    const isDefault = domain.name === DEFAULT_PULP_DOMAIN;
    const defaultTooltip = {
      content: "The default domain can't be edited or deleted.",
    };
    return {
      id: domain.pulp_href,
      row: [
        {
          cell: domain.name,
          props: { dataLabel: "Name" },
        },
        {
          cell: domain.description || "—",
          props: { dataLabel: "Description", modifier: "truncate" },
        },
        {
          cell: storageClassLabel(domain.storage_class),
          props: { dataLabel: "Storage" },
        },
        {
          cell: <YesNoLabel value={domain.redirect_to_object_storage} />,
          props: { dataLabel: "Redirect to object storage" },
        },
        {
          cell: <YesNoLabel value={domain.hide_guarded_distributions} />,
          props: { dataLabel: "Hide guarded distributions" },
        },
        {
          cell: formatDateTime(domain.pulp_created) ?? "—",
          props: { dataLabel: "Created" },
        },
        {
          cell: (
            <ResourceTaskStatus
              count={getActiveCount(domain.prn)}
              kind={getTaskKinds(domain.prn)[0]}
            />
          ),
          props: { dataLabel: "Status" },
        },
        {
          cell: (
            <ActionsColumn
              items={[
                {
                  title: "Edit",
                  onClick: () => setModalState(domain),
                  isAriaDisabled: isDefault,
                  ...(isDefault ? { tooltipProps: defaultTooltip } : {}),
                },
                {
                  title: "Delete",
                  onClick: () => setDeleteTarget(domain),
                  isAriaDisabled: isDefault,
                  ...(isDefault ? { tooltipProps: defaultTooltip } : {}),
                },
              ]}
            />
          ),
          props: { dataLabel: "Actions", isActionCell: true },
        },
      ],
    };
  });

  const expandedRows = resourceTaskExpansions({
    entities: domains,
    getActiveCount,
    statusColumnIndex: STATUS_COLUMN_INDEX,
  });

  const { activeState, bodyStates } = dataViewBodyStates({
    columnCount: columns.length,
    isLoading,
    error,
    isEmpty: domains.length === 0,
    emptyState: (
      <TableEmptyState
        title="No domains found"
        isFiltered={Boolean(debouncedName)}
        onClearFilters={clearAllFilters}
      />
    ),
  });

  const handleDelete = () => {
    const target = deleteTarget;
    if (!target?.pulp_href) return;
    deleteMutation.mutate(
      { href: target.pulp_href, name: target.name ?? "" },
      { onSuccess: () => setDeleteTarget(null) },
    );
  };

  return (
    <>
      <DocumentTitle title="Domains" />
      <PageSection>
        <Content component={ContentVariants.h1}>Domains</Content>
        <Content component={ContentVariants.p}>
          A domain is a tenancy boundary (similar to a namespace) that isolates
          content and has its own storage backend.
        </Content>

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
            actions={
              <Button variant="primary" onClick={() => setModalState("create")}>
                Create domain
              </Button>
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
            aria-label="Domains table"
            columns={columns}
            rows={rows}
            bodyStates={bodyStates}
            isExpandable={expandedRows.length > 0}
            expandedRows={expandedRows}
            indexBy="id"
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

        <DomainModal
          isOpen={modalState !== null}
          domain={domainToEdit}
          onClose={() => setModalState(null)}
        />

        <ConfirmActionModal
          isOpen={!!deleteTarget}
          title="Delete Domain"
          body={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
          isConfirming={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </PageSection>
    </>
  );
};

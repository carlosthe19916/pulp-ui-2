import type React from "react";
import { useState } from "react";

import {
  Button,
  Content,
  ContentVariants,
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

import { dataViewBodyStates } from "@app/components/dataViewStates";
import { ListPagination } from "@app/components/ListPagination";
import { ObjectAccessModal } from "@app/components/ObjectAccessModal";
import { TaskActionModal } from "@app/components/TaskActionModal";
import { useColumnSort } from "@app/hooks/useColumnSort";
import type { DataViewTh } from "@app/utils/dataViewTypes";
import type { IEntityField } from "@catalog";
import type { ContainerContainerNamespaceResponse } from "@app/client";
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { DomainContextSelector } from "@app/components/DomainContextSelector";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { useNotifications } from "@app/hooks/useNotifications";
import { useSubmitError } from "@app/hooks/useSubmitError";
import {
  type IContainerNamespaceListParams,
  useContainerNamespaceCreateMutation,
  useContainerNamespaceDeleteMutation,
  useContainerNamespacesListQuery,
} from "@app/queries/container-namespaces";
import type { OrderingField } from "@app/queries/utils/listParams";
import { notifyTaskStarted } from "@app/utils/taskNotify";
import { formatDateTime, getMutationErrorMessage } from "@app/utils/utils";

import { PulpLabels } from "./components/PulpLabels";

const SORTABLE_COLUMN_KEYS = [
  "name",
  "pulp_created",
] as const satisfies readonly OrderingField<IContainerNamespaceListParams>[];

const CREATE_FIELDS: IEntityField[] = [
  { key: "name", label: "Name", type: "text", required: true },
];

interface INamespaceFilters {
  name: string;
}

/** Container namespaces: the first path segment of pushed repositories. */
export const ContainerNamespaceList: React.FC = () => {
  const { addNotification } = useNotifications();
  const { submitError, setSubmitError, clearSubmitError } = useSubmitError();
  const [isCreating, setIsCreating] = useState(false);
  const [accessTarget, setAccessTarget] =
    useState<ContainerContainerNamespaceResponse | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<ContainerContainerNamespaceResponse | null>(null);

  const pagination = useDataViewPagination({ perPage: 10 });
  const { ordering, sortProps } = useColumnSort({
    columnKeys: SORTABLE_COLUMN_KEYS,
    initialSort: { sortBy: "name", direction: "asc" },
    onSortChange: () => pagination.onSetPage(undefined, 1),
  });
  const { filters, onSetFilters, clearAllFilters } =
    useDataViewFilters<INamespaceFilters>({ initialFilters: { name: "" } });
  const debouncedName = useDebouncedValue({ value: filters.name });
  const { data, isLoading, error } = useContainerNamespacesListQuery({
    params: {
      limit: pagination.perPage,
      offset: (pagination.page - 1) * pagination.perPage,
      ordering,
      name__icontains: debouncedName || undefined,
    },
  });

  const createMutation = useContainerNamespaceCreateMutation({
    onSuccess: ({ name }) =>
      addNotification({
        title: `Namespace "${name}" created`,
        variant: "success",
      }),
    onError: (err) =>
      setSubmitError(
        getMutationErrorMessage({
          error: err,
          fallback: "Failed to create namespace",
        }),
      ),
  });
  const deleteMutation = useContainerNamespaceDeleteMutation({
    onSuccess: (result, { name }) =>
      notifyTaskStarted({
        addNotification,
        taskHref: result.task,
        title: `Namespace "${name}" deletion started`,
      }),
    onError: (err, { name }) =>
      addNotification({
        ...getMutationErrorMessage({
          error: err,
          fallback: `Failed to delete namespace "${name}"`,
        }),
        variant: "danger",
      }),
  });

  const namespaces = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const columns: DataViewTh[] = [
    { cell: "Name", props: { sort: sortProps("name") } },
    { cell: "Labels" },
    { cell: "Created", props: { sort: sortProps("pulp_created") } },
    { cell: "", props: { screenReaderText: "Actions" } },
  ];
  const rows: DataViewTr[] = namespaces.map((namespace) => ({
    id: namespace.pulp_href,
    row: [
      { cell: namespace.name, props: { dataLabel: "Name" } },
      {
        cell: <PulpLabels labels={namespace.pulp_labels} />,
        props: { dataLabel: "Labels" },
      },
      {
        cell: formatDateTime(namespace.pulp_created) ?? "—",
        props: { dataLabel: "Created" },
      },
      {
        cell: (
          <ActionsColumn
            items={[
              {
                title: "Manage access",
                onClick: () => setAccessTarget(namespace),
              },
              { title: "Delete", onClick: () => setDeleteTarget(namespace) },
            ]}
          />
        ),
        props: { dataLabel: "Actions", isActionCell: true },
      },
    ],
  }));

  const { activeState, bodyStates } = dataViewBodyStates({
    columnCount: columns.length,
    isLoading,
    error,
    isEmpty: namespaces.length === 0,
    emptyState: (
      <TableEmptyState
        title="No namespaces found"
        body="Pushing an image creates its namespace."
        isFiltered={!!debouncedName}
        onClearFilters={clearAllFilters}
      />
    ),
  });

  const closeCreate = () => {
    clearSubmitError();
    setIsCreating(false);
  };

  return (
    <>
      <DocumentTitle title="Container namespaces" />
      <DomainContextSelector />
      <PageSection>
        <Content component={ContentVariants.h1}>Container namespaces</Content>
        <Content component={ContentVariants.p}>
          A namespace groups pushed repositories under one path; access to it
          governs who can push there.
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
            actions={
              <Button variant="primary" onClick={() => setIsCreating(true)}>
                Create namespace
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
            aria-label="Container namespaces table"
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

      {isCreating && (
        <TaskActionModal
          title="Create namespace"
          submitLabel="Create"
          fields={CREATE_FIELDS}
          isSubmitting={createMutation.isPending}
          submitError={submitError}
          onSubmit={(body) => {
            clearSubmitError();
            createMutation.mutate(
              { name: String(body.name) },
              { onSuccess: closeCreate },
            );
          }}
          onClose={closeCreate}
        />
      )}
      {accessTarget && (
        <ObjectAccessModal
          href={accessTarget.pulp_href ?? ""}
          name={accessTarget.name}
          onClose={() => setAccessTarget(null)}
        />
      )}
      <ConfirmActionModal
        isOpen={!!deleteTarget}
        title="Delete namespace"
        body={`Delete namespace "${deleteTarget?.name}" and every repository in it? This action cannot be undone.`}
        isConfirming={deleteMutation.isPending}
        onConfirm={() =>
          deleteTarget &&
          deleteMutation.mutate(deleteTarget, {
            onSuccess: () => setDeleteTarget(null),
          })
        }
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
};

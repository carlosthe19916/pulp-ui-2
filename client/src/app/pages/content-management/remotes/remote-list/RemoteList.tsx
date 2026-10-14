import type React from "react";
import { use, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import {
  Button,
  Content,
  ContentVariants,
  PageSection,
  Pagination,
  PaginationVariant,
  Tooltip,
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
import { ActionsColumn } from "@patternfly/react-table";

import { getPlugin } from "@catalog";
import type { GenericRemoteResponse } from "@app/client";
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import {
  dataViewBodyStates,
  useColumnSort,
  type DataViewTh,
} from "@app/components/DataView";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { DomainContextSelector } from "@app/components/DomainContextSelector";
import { RemoteModal } from "./components/RemoteModal";
import { useRemoteActions } from "./hooks/useRemoteActions";
import { EntityTaskStatus } from "@app/components/EntityTaskStatus";
import { PulpTypeLabel } from "@app/components/PulpTypeLabel";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { EntityTaskTrackerContext } from "@app/context/EntityTaskTracker/EntityTaskTrackerContext";
import { useNotifications } from "@app/context/useNotifications";
import { useCreatablePlugins } from "@app/hooks/pluginForm/useCreatablePlugins";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { useEntityTaskWatcher } from "@app/hooks/useEntityTaskWatcher";
import type { IRemoteListParams } from "@app/queries/remotes";
import { remoteKeys, useRemotesListQuery } from "@app/queries/remotes";
import type { OrderingField } from "@app/queries/utils/listParams";
import {
  extractIdFromHref,
  resolvePulpType,
} from "@app/queries/utils/pulpHref";

const SORTABLE_COLUMN_KEYS = [
  "name",
  "url",
  "policy",
] as const satisfies readonly OrderingField<IRemoteListParams>[];

interface IRemoteFilters {
  name: IRemoteListParams["name"];
  pulp_type: IRemoteListParams["pulp_type"];
}

export const RemoteList: React.FC = () => {
  const { tasksById } = use(EntityTaskTrackerContext);
  const { addNotification } = useNotifications();
  const queryClient = useQueryClient();

  const [modalState, setModalState] = useState<
    "create" | GenericRemoteResponse | null
  >(null);
  const remoteToEdit =
    modalState === "create" ? undefined : (modalState ?? undefined);

  const [deleteTarget, setDeleteTarget] =
    useState<GenericRemoteResponse | null>(null);

  const canCreate = useCreatablePlugins("remote").length > 0;
  const { deleteRemote, isDeleting } = useRemoteActions();

  const { page, perPage, onSetPage, onPerPageSelect } = useDataViewPagination({
    perPage: 10,
  });

  const { ordering, sortProps } = useColumnSort({
    columnKeys: SORTABLE_COLUMN_KEYS,
    initialSort: { sortBy: "name", direction: "asc" },
    onSortChange: () => onSetPage(undefined, 1),
  });

  const { filters, onSetFilters, clearAllFilters } =
    useDataViewFilters<IRemoteFilters>({});
  const debouncedName = useDebouncedValue(filters.name);
  const debouncedPulpType = useDebouncedValue(filters.pulp_type);

  const { data, isLoading, error } = useRemotesListQuery({
    limit: perPage,
    offset: (page - 1) * perPage,
    ordering,
    name__icontains: debouncedName || undefined,
    pulp_type: debouncedPulpType || undefined,
  });

  const remotes = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  useEntityTaskWatcher({
    entities: remotes,
    onFinishedState: ({ task, tracked, entity }) => {
      void queryClient.invalidateQueries({ queryKey: remoteKeys.list() });
      if (task.state === "failed" || task.state === "canceled") {
        addNotification({
          title: `Failed to ${tracked.kind} remote "${entity.name}"`,
          variant: "danger",
        });
      }
    },
  });

  const columns: DataViewTh[] = [
    {
      cell: "Name",
      props: {
        sort: sortProps("name"),
        width: 25,
      },
    },
    {
      cell: "URL",
      props: {
        sort: sortProps("url"),
        width: 50,
      },
    },
    {
      cell: "Policy",
      props: {
        sort: sortProps("policy"),
        width: 15,
      },
    },
    {
      cell: "Type",
      props: {
        width: 10,
      },
    },
    {
      cell: "",
      props: {
        screenReaderText: "Actions",
      },
    },
  ];

  const rows: DataViewTr[] = remotes.map((remote) => {
    const remoteId = extractIdFromHref(remote.pulp_href ?? "");
    const pulpType = resolvePulpType(remote.pulp_href);
    const task = remoteId ? tasksById[remoteId] : undefined;
    const canEdit = !!(pulpType && getPlugin(pulpType)?.entities.remote);

    return {
      id: remote.pulp_href,
      row: [
        {
          cell: remote.name,
          props: { dataLabel: "Name" },
        },
        {
          cell: remote.url || "—",
          props: { dataLabel: "URL", modifier: "truncate" },
        },
        {
          cell: remote.policy ?? "—",
          props: { dataLabel: "Policy" },
        },
        {
          cell: pulpType ? <PulpTypeLabel pulpType={pulpType} /> : "—",
          props: { dataLabel: "Type" },
        },
        {
          cell: task ? (
            <EntityTaskStatus kind={task.kind} />
          ) : (
            <ActionsColumn
              items={[
                {
                  title: "Edit",
                  isAriaDisabled: !canEdit,
                  tooltipProps: canEdit
                    ? undefined
                    : {
                        content:
                          "This remote's plugin type isn't available in the UI.",
                      },
                  onClick: () => setModalState(remote),
                },
                {
                  title: "Delete",
                  onClick: () => setDeleteTarget(remote),
                },
              ]}
            />
          ),
          props: { dataLabel: "Actions", isActionCell: true },
        },
      ],
    };
  });

  const { activeState, bodyStates } = dataViewBodyStates({
    columnCount: columns.length,
    isLoading: isLoading,
    error,
    isEmpty: remotes.length === 0,
    emptyState: (
      <TableEmptyState
        title="No remotes found"
        isFiltered={Boolean(debouncedName || debouncedPulpType)}
        onClearFilters={clearAllFilters}
      />
    ),
  });

  const pagination = (variant: PaginationVariant) => (
    <Pagination
      variant={variant}
      itemCount={totalCount}
      page={page}
      perPage={perPage}
      onSetPage={onSetPage}
      onPerPageSelect={onPerPageSelect}
    />
  );

  const handleDelete = async () => {
    const target = deleteTarget;
    if (!target?.pulp_href) return;
    try {
      // Wait for the 202 (task accepted) before closing; the row then shows "Deleting".
      await deleteRemote(target);
      setDeleteTarget(null);
    } catch {
      // Error surfaced as a toast; keep the modal open.
    }
  };

  return (
    <>
      <DocumentTitle title="Remotes" />
      <DomainContextSelector />
      <PageSection>
        <Content component={ContentVariants.h1}>Remotes</Content>

        <DataView activeState={activeState}>
          <DataViewToolbar
            clearAllFilters={clearAllFilters}
            filters={
              <DataViewFilters
                onChange={(_key, newFilters) => {
                  onSetFilters(newFilters);
                  onSetPage(undefined, 1);
                }}
                values={filters}
              >
                <DataViewTextFilter filterId="name" title="Name" />
                <DataViewTextFilter
                  filterId="pulp_type"
                  title="Type"
                  placeholder="pulp_type (e.g. file.file)"
                />
              </DataViewFilters>
            }
            actions={
              canCreate ? (
                <Button
                  variant="primary"
                  onClick={() => setModalState("create")}
                >
                  Create remote
                </Button>
              ) : (
                <Tooltip content="No remote plugin is available. Install a content plugin (e.g. pulp_file) to create remotes.">
                  <Button variant="primary" isAriaDisabled>
                    Create remote
                  </Button>
                </Tooltip>
              )
            }
            pagination={pagination(PaginationVariant.top)}
          />

          <DataViewTable
            aria-label="Remotes table"
            columns={columns}
            rows={rows}
            bodyStates={bodyStates}
          />

          <DataViewToolbar pagination={pagination(PaginationVariant.bottom)} />
        </DataView>

        <RemoteModal
          isOpen={modalState !== null}
          entity={remoteToEdit}
          onClose={() => setModalState(null)}
        />

        <ConfirmActionModal
          isOpen={!!deleteTarget}
          title="Delete Remote"
          body={`Are you sure you want to delete remote "${deleteTarget?.name}"? This action cannot be undone.`}
          isConfirming={isDeleting}
          onConfirm={() => void handleDelete()}
          onCancel={() => setDeleteTarget(null)}
        />
      </PageSection>
    </>
  );
};

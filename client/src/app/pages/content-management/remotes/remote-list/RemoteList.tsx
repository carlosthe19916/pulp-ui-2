import type React from "react";
import { createElement, Suspense, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import {
  Button,
  Content,
  ContentVariants,
  Label,
  PageSection,
  PaginationVariant,
  Tooltip,
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
import { ActionsColumn } from "@patternfly/react-table";

import type { GenericRemoteResponse } from "@app/client";
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import { dataViewBodyStates } from "@app/components/dataViewStates";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { DomainContextSelector } from "@app/components/DomainContextSelector";
import { ListPagination } from "@app/components/ListPagination";
import { MultiSelectFilter } from "@app/components/MultiSelectFilter";
import { ResourceHrefLink } from "@app/components/ResourceHrefLink";
import { resourceTaskExpansions } from "@app/components/resourceTaskExpansions";
import { ResourceTaskStatus } from "@app/components/ResourceTaskStatus";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { useApiStatus } from "@app/hooks/useApiStatus";
import { useCreatableTypes } from "@app/hooks/useCreatableTypes";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { useNotifications } from "@app/hooks/useNotifications";
import { useObjectsPermissions } from "@app/hooks/useObjectPermissions";
import { usePersistentState } from "@app/hooks/usePersistentState";
import { useResourceTasks } from "@app/hooks/useResourceTasks";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import {
  remoteKeys,
  useRemoteDeleteMutation,
  useRemotesListQuery,
} from "@app/queries/remotes";
import {
  extractIdFromHref,
  hasRoleEndpoints,
  resolvePulpType,
} from "@app/queries/utils/pulpHref";
import type { DataViewTh } from "@app/utils/dataViewTypes";
import { columnSort } from "@app/utils/sortHelpers";
import { notifyTaskStarted } from "@app/utils/taskNotify";
import { getMutationErrorMessage } from "@app/utils/utils";
import { getAvailableTypes } from "@catalog";
import { getCreateAlternatives, getEntityForm, getTypeLabel } from "@plugins";

import { REMOTE_LIST_STATE, SORTABLE_COLUMN_KEYS } from "./remoteListState";

export const RemoteList: React.FC = () => {
  const { addNotification } = useNotifications();
  const queryClient = useQueryClient();

  const navigate = useNavigate();
  const { name: pulpDomain } = useSelectedDomain();
  const installed = useApiStatus().plugins;
  const typeOptions = getAvailableTypes({ entity: "remote", installed }).map(
    ({ pulpType }) => ({
      value: pulpType,
      label: getTypeLabel({ entity: "remote", pulpType }),
    }),
  );

  const [deleteTarget, setDeleteTarget] =
    useState<GenericRemoteResponse | null>(null);

  const creatableTypes = useCreatableTypes("remote");
  const canCreate = creatableTypes.length > 0;
  // Other ways to create a remote that installed plugins offer (e.g. a Bandersnatch config).
  const alternatives = creatableTypes.flatMap((option) =>
    getCreateAlternatives(option.pulpType).map((alternative) => ({
      ...alternative,
      key: `${option.pulpType}/${alternative.key}`,
    })),
  );
  const [openAlternative, setOpenAlternative] = useState<string | null>(null);
  const openModal = alternatives.find(({ key }) => key === openAlternative);
  const deleteMutation = useRemoteDeleteMutation({
    onSuccess: (data, { name }) =>
      notifyTaskStarted({
        addNotification,
        taskHref: data.task,
        title: `Remote "${name}" deletion started`,
      }),
    onError: (error, { name }) =>
      addNotification({
        ...getMutationErrorMessage({
          error,
          fallback: `Failed to delete remote "${name}"`,
        }),
        variant: "danger",
      }),
  });
  const isDeleting = deleteMutation.isPending;

  const [pagination, setPagination] = usePersistentState({
    ...REMOTE_LIST_STATE.pagination,
    storage: "url",
  });
  const toFirstPage = () => setPagination((prev) => ({ ...prev, page: 1 }));

  const [sort, setSort] = usePersistentState({
    ...REMOTE_LIST_STATE.sort,
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
    ...REMOTE_LIST_STATE.filters,
    storage: "url",
  });
  const clearAllFilters = () => {
    setFilters(REMOTE_LIST_STATE.filters.defaultValue);
    toFirstPage();
  };
  const debouncedName = useDebouncedValue({ value: filters.name });

  const { data, isLoading, error } = useRemotesListQuery({
    params: {
      limit: pagination.perPage,
      offset: (pagination.page - 1) * pagination.perPage,
      ordering,
      name__icontains: debouncedName || undefined,
      pulp_type__in: filters.pulp_type.length ? filters.pulp_type : undefined,
    },
  });

  const remotes = data?.results ?? [];

  const { disabledProps } = useObjectsPermissions({
    hrefs: remotes
      .filter((item) => hasRoleEndpoints(item.pulp_href))
      .map((item) => item.pulp_href ?? ""),
  });
  const totalCount = data?.count ?? 0;

  const { getActiveCount, getTaskKinds } = useResourceTasks({
    entities: remotes,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: remoteKeys.list() });
    },
  });

  // Status is task-driven: show the column only when a remote actually has an in-flight task,
  // so it isn't a column of dashes.
  const hasAnyActiveTask = remotes.some(
    (remote) => getActiveCount(remote.prn) > 0,
  );

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
        width: 40,
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
    ...(hasAnyActiveTask
      ? [{ cell: "Status", props: { width: 10 } } satisfies DataViewTh]
      : []),
    {
      cell: "",
      props: {
        screenReaderText: "Actions",
      },
    },
  ];

  const rows: DataViewTr[] = remotes.map((remote) => {
    const pulpType = resolvePulpType(remote.pulp_href);
    const canEdit = !!(
      pulpType && getEntityForm({ entity: "remote", pulpType, mode: "edit" })
    );

    return {
      id: remote.pulp_href,
      row: [
        {
          cell: (
            <ResourceHrefLink
              kind="remote"
              href={remote.pulp_href}
              label={remote.name}
            />
          ),
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
          cell: pulpType ? <Label color="blue">{pulpType}</Label> : "—",
          props: { dataLabel: "Type" },
        },
        ...(hasAnyActiveTask
          ? [
              {
                cell: (
                  <ResourceTaskStatus
                    count={getActiveCount(remote.prn)}
                    kind={getTaskKinds(remote.prn)[0]}
                  />
                ),
                props: { dataLabel: "Status" },
              },
            ]
          : []),
        {
          cell: (
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
                  onClick: () =>
                    pulpType &&
                    void navigate({
                      to: "/content-management/$pulpDomain/remotes/$remoteType/$remoteId/edit",
                      params: {
                        pulpDomain,
                        remoteType: pulpType,
                        remoteId: extractIdFromHref(remote.pulp_href ?? ""),
                      },
                    }),
                  ...(canEdit
                    ? disabledProps({ href: remote.pulp_href, verb: "change" })
                    : {}),
                },
                {
                  title: "Delete",
                  onClick: () => setDeleteTarget(remote),
                  ...disabledProps({ href: remote.pulp_href, verb: "delete" }),
                },
              ]}
            />
          ),
          props: { dataLabel: "Actions", isActionCell: true },
        },
      ],
    };
  });

  const STATUS_COLUMN_INDEX = 4;
  const expandedRows: ExpandableContent[] = hasAnyActiveTask
    ? resourceTaskExpansions({
        entities: remotes,
        getActiveCount,
        statusColumnIndex: STATUS_COLUMN_INDEX,
      })
    : [];

  const { activeState, bodyStates } = dataViewBodyStates({
    columnCount: columns.length,
    isLoading: isLoading,
    error,
    isEmpty: remotes.length === 0,
    emptyState: (
      <TableEmptyState
        title="No remotes found"
        isFiltered={Boolean(debouncedName) || filters.pulp_type.length > 0}
        onClearFilters={clearAllFilters}
      />
    ),
  });

  const handleDelete = () => {
    const target = deleteTarget;
    if (!target?.pulp_href) return;
    // Toast fires from the hook-level callbacks (survives unmount); close the
    // dialog only on success so it stays open to retry on error.
    deleteMutation.mutate(target, { onSuccess: () => setDeleteTarget(null) });
  };

  return (
    <>
      <DocumentTitle title="Remotes" />
      <DomainContextSelector />
      <PageSection>
        <Content component={ContentVariants.h1}>Remotes</Content>
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
                <MultiSelectFilter
                  filterId="pulp_type"
                  title="Type"
                  options={typeOptions}
                />
              </DataViewFilters>
            }
            actions={
              canCreate ? (
                <>
                  <Button
                    variant="primary"
                    onClick={() =>
                      void navigate({
                        to: "/content-management/$pulpDomain/remotes/create",
                        params: { pulpDomain },
                      })
                    }
                  >
                    Create remote
                  </Button>
                  {alternatives.map(({ key, label }) => (
                    <Button
                      key={key}
                      variant="secondary"
                      onClick={() => setOpenAlternative(key)}
                    >
                      {label}
                    </Button>
                  ))}
                </>
              ) : (
                <Tooltip content="No remote plugin is available. Install a content plugin (e.g. pulp_file) to create remotes.">
                  <Button variant="primary" isAriaDisabled>
                    Create remote
                  </Button>
                </Tooltip>
              )
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
            aria-label="Remotes table"
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
                onPaginationChange={setPagination}
              />
            }
          />
        </DataView>

        {openModal && (
          <Suspense fallback={null}>
            {createElement(openModal.Modal, {
              onClose: () => setOpenAlternative(null),
            })}
          </Suspense>
        )}

        <ConfirmActionModal
          isOpen={!!deleteTarget}
          title="Delete Remote"
          body={`Are you sure you want to delete remote "${deleteTarget?.name}"? This action cannot be undone.`}
          isConfirming={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </PageSection>
    </>
  );
};

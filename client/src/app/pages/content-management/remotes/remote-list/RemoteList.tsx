import type React from "react";
import { useState } from "react";

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
  useDataViewFilters,
  useDataViewPagination,
} from "@patternfly/react-data-view";
import { ActionsColumn } from "@patternfly/react-table";

import type { GenericRemoteResponse } from "@app/client";
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import { dataViewBodyStates } from "@app/components/dataViewStates";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { DomainContextSelector } from "@app/components/DomainContextSelector";
import { ListPagination } from "@app/components/ListPagination";
import { ResourceHrefLink } from "@app/components/ResourceHrefLink";
import { resourceTaskExpansions } from "@app/components/resourceTaskExpansions";
import { ResourceTaskStatus } from "@app/components/ResourceTaskStatus";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { useColumnSort } from "@app/hooks/useColumnSort";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { useNotifications } from "@app/hooks/useNotifications";
import { useObjectsPermissions } from "@app/hooks/useObjectPermissions";
import { useResourceTasks } from "@app/hooks/useResourceTasks";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import type { IRemoteListParams } from "@app/queries/remotes";
import {
  remoteKeys,
  useRemoteDeleteMutation,
  useRemotesListQuery,
} from "@app/queries/remotes";
import type { OrderingField } from "@app/queries/utils/listParams";
import {
  extractIdFromHref,
  hasRoleEndpoints,
  resolvePulpType,
} from "@app/queries/utils/pulpHref";
import type { DataViewTh } from "@app/utils/dataViewTypes";
import { notifyTaskStarted } from "@app/utils/taskNotify";
import { getMutationErrorMessage } from "@app/utils/utils";
import { getEntityForm, useCreatableTypes } from "@plugins";

import { BandersnatchRemoteModal } from "./components/BandersnatchRemoteModal";

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
  const { addNotification } = useNotifications();
  const queryClient = useQueryClient();

  const navigate = useNavigate();
  const { name: pulpDomain } = useSelectedDomain();

  const [deleteTarget, setDeleteTarget] =
    useState<GenericRemoteResponse | null>(null);

  const creatableTypes = useCreatableTypes("remote");
  const canCreate = creatableTypes.length > 0;
  const canCreatePython = creatableTypes.some(
    (option) => option.pulpType === "python.python",
  );
  const [isBandersnatchOpen, setIsBandersnatchOpen] = useState(false);
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

  const pagination = useDataViewPagination({ perPage: 10 });

  const { ordering, sortProps } = useColumnSort({
    columnKeys: SORTABLE_COLUMN_KEYS,
    initialSort: { sortBy: "name", direction: "asc" },
    onSortChange: () => pagination.onSetPage(undefined, 1),
  });

  const { filters, onSetFilters, clearAllFilters } =
    useDataViewFilters<IRemoteFilters>({});
  const debouncedName = useDebouncedValue({ value: filters.name });
  const debouncedPulpType = useDebouncedValue({ value: filters.pulp_type });

  const { data, isLoading, error } = useRemotesListQuery({
    params: {
      limit: pagination.perPage,
      offset: (pagination.page - 1) * pagination.perPage,
      ordering,
      name__icontains: debouncedName || undefined,
      pulp_type: debouncedPulpType || undefined,
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
        isFiltered={Boolean(debouncedName || debouncedPulpType)}
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
                  onSetFilters(newFilters);
                  pagination.onSetPage(undefined, 1);
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
                  {canCreatePython && (
                    <Button
                      variant="secondary"
                      onClick={() => setIsBandersnatchOpen(true)}
                    >
                      From Bandersnatch config
                    </Button>
                  )}
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
              />
            }
          />
        </DataView>

        {isBandersnatchOpen && (
          <BandersnatchRemoteModal
            onClose={() => setIsBandersnatchOpen(false)}
          />
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

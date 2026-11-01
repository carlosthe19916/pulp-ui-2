import type React from "react";
import { useState } from "react";

import {
  Button,
  Content,
  ContentVariants,
  PageSection,
  PaginationVariant,
  ToggleGroup,
  ToggleGroupItem,
  ToolbarItem,
} from "@patternfly/react-core";
import {
  DataView,
  DataViewFilters,
  DataViewTable,
  DataViewTextFilter,
  DataViewToolbar,
  type DataViewTr,
} from "@patternfly/react-data-view";
import { ActionsColumn } from "@patternfly/react-table";

import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import { dataViewBodyStates } from "@app/components/dataViewStates";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { DomainContextSelector } from "@app/components/DomainContextSelector";
import { ListPagination } from "@app/components/ListPagination";
import { NamedResourceHrefLink } from "@app/components/NamedResourceHrefLink";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { useApiStatus } from "@app/hooks/useApiStatus";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { useNotifications } from "@app/hooks/useNotifications";
import { useObjectsPermissions } from "@app/hooks/useObjectPermissions";
import { usePersistentState } from "@app/hooks/usePersistentState";
import {
  type AlternateContentSource,
  useAcsDeleteMutation,
  useAcsListQuery,
  useAcsRefreshMutation,
} from "@app/queries/acs";
import type { DataViewTh } from "@app/utils/dataViewTypes";
import {
  notifyTaskGroupStarted,
  notifyTaskStarted,
} from "@app/utils/taskNotify";
import { formatDateTime, getMutationErrorMessage } from "@app/utils/utils";
import { getAcsTypes } from "@plugins";

import { ACS_LIST_STATE } from "./acsListState";
import { AcsModal } from "./components/AcsModal";

/**
 * Alternate content sources: places (e.g. a local mirror) a sync fetches content
 * from instead of the remote. One plugin at a time — they have no shared list.
 */
export const AcsList: React.FC = () => {
  const { plugins } = useApiStatus();
  const { addNotification } = useNotifications();
  const types = getAcsTypes({ installed: plugins });
  const [selectedPath, setSelectedPath] = useState<string>();
  const acsType =
    types.find((type) => type.apiPath === selectedPath) ?? types[0];
  const [modalState, setModalState] = useState<
    "create" | AlternateContentSource | null
  >(null);
  const [deleteTarget, setDeleteTarget] =
    useState<AlternateContentSource | null>(null);

  const [pagination, setPagination] = usePersistentState({
    ...ACS_LIST_STATE.pagination,
    storage: "url",
  });
  const toFirstPage = () => setPagination((prev) => ({ ...prev, page: 1 }));

  const [filters, setFilters] = usePersistentState({
    ...ACS_LIST_STATE.filters,
    storage: "url",
  });
  const clearAllFilters = () => {
    setFilters(ACS_LIST_STATE.filters.defaultValue);
    toFirstPage();
  };
  const debouncedName = useDebouncedValue({ value: filters.name });
  const { data, isLoading, error } = useAcsListQuery({
    apiPath: acsType?.apiPath ?? "",
    params: {
      limit: pagination.perPage,
      offset: (pagination.page - 1) * pagination.perPage,
      ordering: "name",
      name__icontains: debouncedName || undefined,
    },
  });
  const refreshMutation = useAcsRefreshMutation({
    onSuccess: (result, { name }) =>
      notifyTaskGroupStarted({
        addNotification,
        taskGroupHref: result.task_group,
        title: `Refresh of "${name}" started`,
      }),
    onError: (err, { name }) =>
      addNotification({
        ...getMutationErrorMessage({
          error: err,
          fallback: `Failed to refresh "${name}"`,
        }),
        variant: "danger",
      }),
  });
  const deleteMutation = useAcsDeleteMutation({
    onSuccess: (result, { name }) =>
      notifyTaskStarted({
        addNotification,
        taskHref: result.task,
        title: `Deletion of "${name}" started`,
      }),
    onError: (err, { name }) =>
      addNotification({
        ...getMutationErrorMessage({
          error: err,
          fallback: `Failed to delete "${name}"`,
        }),
        variant: "danger",
      }),
  });

  const sources = data?.results ?? [];

  const { disabledProps } = useObjectsPermissions({
    hrefs: sources.map((item) => item.pulp_href ?? ""),
  });
  const totalCount = data?.count ?? 0;
  const columns: DataViewTh[] = [
    { cell: "Name", props: { width: 25 } },
    { cell: "Remote", props: { width: 25 } },
    { cell: "Paths", props: { width: 30 } },
    { cell: "Last refreshed", props: { width: 20 } },
    { cell: "", props: { screenReaderText: "Actions" } },
  ];
  const rows: DataViewTr[] = sources.map((acs) => ({
    id: acs.pulp_href,
    row: [
      { cell: acs.name, props: { dataLabel: "Name" } },
      {
        cell: <NamedResourceHrefLink kind="remote" href={acs.remote} />,
        props: { dataLabel: "Remote", modifier: "truncate" },
      },
      {
        cell: acs.paths?.length ? acs.paths.join(", ") : "—",
        props: { dataLabel: "Paths", modifier: "truncate" },
      },
      {
        cell: formatDateTime(acs.last_refreshed) ?? "Never",
        props: { dataLabel: "Last refreshed" },
      },
      {
        cell: (
          <ActionsColumn
            items={[
              {
                title: "Refresh",
                onClick: () => refreshMutation.mutate(acs),
                ...disabledProps({ href: acs.pulp_href, verb: "refresh" }),
              },
              {
                title: "Edit",
                onClick: () => setModalState(acs),
                ...disabledProps({ href: acs.pulp_href, verb: "change" }),
              },
              {
                title: "Delete",
                onClick: () => setDeleteTarget(acs),
                ...disabledProps({ href: acs.pulp_href, verb: "delete" }),
              },
            ]}
          />
        ),
        props: { dataLabel: "Actions", isActionCell: true },
      },
    ],
  }));
  const { activeState, bodyStates } = dataViewBodyStates({
    columnCount: columns.length,
    isLoading: !!acsType && isLoading,
    error,
    isEmpty: sources.length === 0,
    emptyState: (
      <TableEmptyState
        title={
          acsType
            ? "No alternate content sources"
            : "No plugin with alternate content sources is installed"
        }
        isFiltered={!!debouncedName}
        onClearFilters={clearAllFilters}
      />
    ),
  });

  return (
    <>
      <DocumentTitle title="Alternate content sources" />
      <DomainContextSelector />
      <PageSection>
        <Content component={ContentVariants.h1}>
          Alternate content sources
        </Content>
        <Content component={ContentVariants.p}>
          Places a sync fetches content from before the remote, such as a nearby
          mirror. Refresh a source after it changes.
        </Content>
      </PageSection>
      <PageSection>
        <DataView activeState={activeState}>
          <DataViewToolbar
            clearAllFilters={clearAllFilters}
            filters={
              <>
                <ToolbarItem>
                  <ToggleGroup aria-label="Plugin">
                    {types.map((type) => (
                      <ToggleGroupItem
                        key={type.apiPath}
                        text={type.label}
                        isSelected={type.apiPath === acsType?.apiPath}
                        onChange={() => {
                          setSelectedPath(type.apiPath);
                          toFirstPage();
                        }}
                      />
                    ))}
                  </ToggleGroup>
                </ToolbarItem>
                <DataViewFilters
                  onChange={(_key, newFilters) => {
                    setFilters((prev) => ({ ...prev, ...newFilters }));
                    toFirstPage();
                  }}
                  values={filters}
                >
                  <DataViewTextFilter filterId="name" title="Name" />
                </DataViewFilters>
              </>
            }
            actions={
              <Button
                variant="primary"
                isDisabled={!acsType}
                onClick={() => setModalState("create")}
              >
                Create source
              </Button>
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
            aria-label="Alternate content sources table"
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

      {acsType && modalState && (
        <AcsModal
          acsType={acsType}
          acs={modalState === "create" ? undefined : modalState}
          onClose={() => setModalState(null)}
        />
      )}
      <ConfirmActionModal
        isOpen={!!deleteTarget}
        title="Delete alternate content source"
        body={`Delete "${deleteTarget?.name}"? Syncs go back to fetching from their remotes.`}
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

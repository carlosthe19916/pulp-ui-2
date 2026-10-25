import type React from "react";
import { useState } from "react";

import {
  Button,
  Content,
  ContentVariants,
  Flex,
  FlexItem,
  Label,
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
  useDataViewFilters,
  useDataViewPagination,
} from "@patternfly/react-data-view";
import { ActionsColumn } from "@patternfly/react-table";

import type { UpstreamPulpResponse } from "@app/client";
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import { dataViewBodyStates } from "@app/components/dataViewStates";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { DomainContextSelector } from "@app/components/DomainContextSelector";
import { ListPagination } from "@app/components/ListPagination";
import { ObjectAccessModal } from "@app/components/ObjectAccessModal";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { TaskActionModal } from "@app/components/TaskActionModal";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { useNotifications } from "@app/hooks/useNotifications";
import { useObjectsPermissions } from "@app/hooks/useObjectPermissions";
import { useSubmitError } from "@app/hooks/useSubmitError";
import {
  useUpstreamPulpCreateMutation,
  useUpstreamPulpDeleteMutation,
  useUpstreamPulpReplicateMutation,
  useUpstreamPulpsListQuery,
  useUpstreamPulpUpdateMutation,
} from "@app/queries/upstream-pulps";
import type { DataViewTh } from "@app/utils/dataViewTypes";
import { buildDefaultValues } from "@app/utils/formSchema";
import { notifyTaskGroupStarted } from "@app/utils/taskNotify";
import { formatDateTime, getMutationErrorMessage } from "@app/utils/utils";

import { REPLICATE_FIELDS, UPSTREAM_FIELDS } from "./utils/upstreamFields";

type Modal =
  | { kind: "create" }
  | { kind: "edit"; upstream: UpstreamPulpResponse }
  | { kind: "replicate"; upstream: UpstreamPulpResponse };

interface IUpstreamFilters {
  name: string;
}

/** Other Pulp servers this domain replicates distributions from. */
export const UpstreamPulpList: React.FC = () => {
  const { addNotification } = useNotifications();
  const { submitError, setSubmitError, clearSubmitError } = useSubmitError();
  const [modal, setModal] = useState<Modal | null>(null);
  const [accessTarget, setAccessTarget] = useState<UpstreamPulpResponse | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<UpstreamPulpResponse | null>(
    null,
  );

  const pagination = useDataViewPagination({ perPage: 10 });
  const { filters, onSetFilters, clearAllFilters } =
    useDataViewFilters<IUpstreamFilters>({ initialFilters: { name: "" } });
  const debouncedName = useDebouncedValue({ value: filters.name });
  const { data, isLoading, error } = useUpstreamPulpsListQuery({
    params: {
      limit: pagination.perPage,
      offset: (pagination.page - 1) * pagination.perPage,
      ordering: "name",
      name__icontains: debouncedName || undefined,
    },
  });

  const closeModal = () => {
    clearSubmitError();
    setModal(null);
  };
  const onFormError = (fallback: string) => (err: unknown) =>
    setSubmitError(getMutationErrorMessage({ error: err, fallback }));
  const createMutation = useUpstreamPulpCreateMutation({
    onSuccess: ({ name }) =>
      addNotification({
        title: `Upstream Pulp "${name}" created`,
        variant: "success",
      }),
    onError: onFormError("Failed to create upstream Pulp"),
  });
  const updateMutation = useUpstreamPulpUpdateMutation({
    onSuccess: ({ name }) =>
      addNotification({
        title: `Upstream Pulp "${name}" saved`,
        variant: "success",
      }),
    onError: onFormError("Failed to save upstream Pulp"),
  });
  const replicateMutation = useUpstreamPulpReplicateMutation({
    onSuccess: (result) =>
      notifyTaskGroupStarted({
        addNotification,
        taskGroupHref: result.task_group,
        title: "Replication started",
      }),
    onError: onFormError("Failed to start replication"),
  });
  const deleteMutation = useUpstreamPulpDeleteMutation({
    onSuccess: (_data, { name }) =>
      addNotification({
        title: `Upstream Pulp "${name}" deleted`,
        variant: "success",
      }),
    onError: (err, { name }) =>
      addNotification({
        ...getMutationErrorMessage({
          error: err,
          fallback: `Failed to delete upstream Pulp "${name}"`,
        }),
        variant: "danger",
      }),
  });

  const upstreams = data?.results ?? [];

  const { disabledProps } = useObjectsPermissions({
    hrefs: upstreams.map((item) => item.pulp_href ?? ""),
  });
  const totalCount = data?.count ?? 0;
  const columns: DataViewTh[] = [
    { cell: "Name" },
    { cell: "URL" },
    { cell: "Policy" },
    { cell: "Last replication" },
    { cell: "", props: { screenReaderText: "Actions" } },
  ];
  const rows: DataViewTr[] = upstreams.map((upstream) => ({
    id: upstream.pulp_href,
    row: [
      { cell: upstream.name, props: { dataLabel: "Name" } },
      {
        cell: `${upstream.base_url}${upstream.api_root}${upstream.domain ? `${upstream.domain}/` : ""}`,
        props: { dataLabel: "URL" },
      },
      { cell: upstream.policy ?? "all", props: { dataLabel: "Policy" } },
      {
        cell: formatDateTime(upstream.last_replication) ?? "Never",
        props: { dataLabel: "Last replication" },
      },
      {
        cell: (
          <ActionsColumn
            items={[
              {
                title: "Replicate…",
                onClick: () => setModal({ kind: "replicate", upstream }),
                ...disabledProps({
                  href: upstream.pulp_href,
                  verb: "replicate",
                }),
              },
              {
                title: "Edit",
                onClick: () => setModal({ kind: "edit", upstream }),
                ...disabledProps({ href: upstream.pulp_href, verb: "change" }),
              },
              {
                title: "Manage access",
                onClick: () => setAccessTarget(upstream),
                ...disabledProps({
                  href: upstream.pulp_href,
                  verb: "manage_roles",
                }),
              },
              {
                title: "Delete",
                onClick: () => setDeleteTarget(upstream),
                ...disabledProps({ href: upstream.pulp_href, verb: "delete" }),
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
    isLoading,
    error,
    isEmpty: upstreams.length === 0,
    emptyState: (
      <TableEmptyState
        title="No upstream Pulps"
        body="Add another Pulp server to replicate its distributions here."
        isFiltered={!!debouncedName}
        onClearFilters={clearAllFilters}
      />
    ),
  });

  return (
    <>
      <DocumentTitle title="Upstream Pulps" />
      <DomainContextSelector />
      <PageSection>
        <Flex alignItems={{ default: "alignItemsCenter" }}>
          <FlexItem>
            <Content component={ContentVariants.h1}>Upstream Pulps</Content>
          </FlexItem>
          <FlexItem>
            <Label color="purple" isCompact>
              Tech preview
            </Label>
          </FlexItem>
        </Flex>
        <Content component={ContentVariants.p}>
          Replicating an upstream Pulp creates or updates a repository, remote
          and distribution here for each of its distributions.
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
              <Button
                variant="primary"
                onClick={() => setModal({ kind: "create" })}
              >
                Add upstream Pulp
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
            aria-label="Upstream Pulps table"
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

      {modal?.kind === "create" && (
        <TaskActionModal
          title="Add upstream Pulp"
          submitLabel="Add"
          fields={UPSTREAM_FIELDS}
          isSubmitting={createMutation.isPending}
          submitError={submitError}
          onSubmit={(body) => {
            clearSubmitError();
            createMutation.mutate(body, { onSuccess: closeModal });
          }}
          onClose={closeModal}
        />
      )}
      {modal?.kind === "edit" && (
        <TaskActionModal
          title={`Edit upstream Pulp "${modal.upstream.name}"`}
          submitLabel="Save"
          fields={UPSTREAM_FIELDS}
          initialValues={buildDefaultValues({
            fields: UPSTREAM_FIELDS,
            source: modal.upstream,
          })}
          isSubmitting={updateMutation.isPending}
          submitError={submitError}
          onSubmit={(body) => {
            clearSubmitError();
            updateMutation.mutate(
              { href: modal.upstream.pulp_href ?? "", body },
              { onSuccess: closeModal },
            );
          }}
          onClose={closeModal}
        />
      )}
      {modal?.kind === "replicate" && (
        <TaskActionModal
          title={`Replicate from "${modal.upstream.name}"`}
          description="Creates or updates local repositories, remotes and distributions to match the upstream's."
          submitLabel="Replicate"
          fields={REPLICATE_FIELDS}
          initialValues={{ q_select: modal.upstream.q_select ?? "" }}
          isSubmitting={replicateMutation.isPending}
          submitError={submitError}
          onSubmit={(body) => {
            clearSubmitError();
            replicateMutation.mutate(
              { href: modal.upstream.pulp_href ?? "", body },
              { onSuccess: closeModal },
            );
          }}
          onClose={closeModal}
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
        title="Delete upstream Pulp"
        body={`Delete upstream Pulp "${deleteTarget?.name}"? Objects it replicated stay.`}
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

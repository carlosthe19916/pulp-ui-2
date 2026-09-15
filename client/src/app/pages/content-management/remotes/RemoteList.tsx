import type React from "react";
import { use, useState } from "react";
import { Link } from "@tanstack/react-router";

import {
  Button,
  Content,
  ContentVariants,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  PageSection,
  Pagination,
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

import type { GenericRemoteResponse } from "@app/client";
import { dataViewBodyStates } from "@app/components/DataView";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { PulpTypeLabel } from "@app/components/PulpTypeLabel";
import { ReadOnlyBadge } from "@app/components/ReadOnlyBadge";
import { UnauthorizedState } from "@app/components/UnauthorizedState";
import { useNotifications } from "@app/context/useNotifications";
import { ApiStatusContext } from "@app/context/ApiStatus/ApiStatusContext";
import {
  getDescriptor,
  getDescriptorsForKind,
} from "@app/descriptors/registry";
import { useFileRemoteDeleteMutation } from "@app/queries/file-remotes";
import { useRemotesListQuery } from "@app/queries/remotes";
import { isForbiddenError } from "@app/utils/isHttpError";
import {
  extractIdFromHref,
  resolvePulpType,
} from "@app/queries/utils/pulpHref";
import { notifyTaskStarted } from "@app/utils/taskNotify";
import { getMutationErrorMessage } from "@app/utils/utils";

import { CreateRemoteModal } from "./components/CreateRemoteModal";

/**
 * The aggregation endpoint returns pulp_type at runtime but the generated
 * type does not include it. Extend the base type for list usage.
 */
type RemoteRow = GenericRemoteResponse & { pulp_type?: string };

interface IRemoteFilters {
  name: string;
  pulp_type: string;
}

export const RemoteList: React.FC = () => {
  const [deleteTarget, setDeleteTarget] = useState<RemoteRow | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { addNotification } = useNotifications();
  const plugins = use(ApiStatusContext)?.plugins ?? [];
  const deleteMutation = useFileRemoteDeleteMutation();

  const { page, perPage, onSetPage, onPerPageSelect } = useDataViewPagination({
    perPage: 20,
  });
  const { filters, onSetFilters, clearAllFilters } =
    useDataViewFilters<IRemoteFilters>({
      initialFilters: { name: "", pulp_type: "" },
    });

  const { data, isLoading, error } = useRemotesListQuery({
    limit: perPage,
    offset: (page - 1) * perPage,
    name__icontains: filters.name || undefined,
    pulp_type: filters.pulp_type
      ? (filters.pulp_type as NonNullable<
          Parameters<typeof useRemotesListQuery>[0]
        >["pulp_type"])
      : undefined,
  });

  const remotes = (data?.results ?? []) as RemoteRow[];
  const totalCount = data?.count ?? 0;

  const canCreate = getDescriptorsForKind("remote").some((d) =>
    d.isAvailable(plugins),
  );

  const columns = [
    "Name",
    "URL",
    "Policy",
    "Type",
    { cell: "", props: { screenReaderText: "Actions" } },
  ];

  const rows: DataViewTr[] = remotes.map((remote) => {
    const remoteId = extractIdFromHref(remote.pulp_href ?? "");
    const pulpType = resolvePulpType(remote.pulp_type, remote.pulp_href);
    const descriptor = pulpType ? getDescriptor("remote", pulpType) : undefined;

    return {
      id: remote.pulp_href,
      row: [
        {
          cell: remoteId ? (
            <Link
              to="/content-management/remotes/$remoteId"
              params={{ remoteId }}
            >
              {remote.name}
            </Link>
          ) : (
            remote.name
          ),
          props: { dataLabel: "Name" },
        },
        {
          cell: remote.url || "—",
          props: { dataLabel: "URL" },
        },
        {
          cell: remote.policy ?? "—",
          props: { dataLabel: "Policy" },
        },
        {
          cell: pulpType ? (
            <PulpTypeLabel kind="remote" pulpType={pulpType} />
          ) : (
            "—"
          ),
          props: { dataLabel: "Type" },
        },
        {
          cell: !descriptor ? (
            <ReadOnlyBadge pulpType={pulpType} />
          ) : (
            <Button
              variant="link"
              isInline
              isDanger
              onClick={() => setDeleteTarget(remote)}
            >
              Delete
            </Button>
          ),
          props: { dataLabel: "Actions", isActionCell: true },
        },
      ],
    };
  });

  const { activeState, bodyStates } = dataViewBodyStates({
    loading: isLoading,
    error,
    empty: remotes.length === 0,
    emptyState: "No remotes found.",
  });

  const pagination = (
    <Pagination
      itemCount={totalCount}
      page={page}
      perPage={perPage}
      onSetPage={onSetPage}
      onPerPageSelect={onPerPageSelect}
    />
  );

  const handleDelete = async () => {
    if (!deleteTarget?.pulp_href) return;
    try {
      const result = await deleteMutation.mutateAsync(deleteTarget.pulp_href);
      const taskHref = result?.task;
      if (taskHref) {
        notifyTaskStarted(
          addNotification,
          taskHref,
          `Remote "${deleteTarget.name}" delete started`,
        );
      }
    } catch (error) {
      addNotification({
        ...getMutationErrorMessage(error, "Failed to delete remote"),
        variant: "danger",
      });
    }
    setDeleteTarget(null);
  };

  return (
    <>
      <DocumentTitle title="Remotes" />
      {isForbiddenError(error) ? (
        <PageSection>
          <UnauthorizedState />
        </PageSection>
      ) : (
        <PageSection>
          <Content component={ContentVariants.h1}>Remotes</Content>

          <DataView activeState={activeState}>
            <DataViewToolbar
              clearAllFilters={clearAllFilters}
              filters={
                <DataViewFilters
                  onChange={(_key, newFilters) => onSetFilters(newFilters)}
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
                    onClick={() => setIsCreateOpen(true)}
                  >
                    Create remote
                  </Button>
                ) : undefined
              }
              pagination={pagination}
            />

            <DataViewTable
              aria-label="Remotes table"
              columns={columns}
              rows={rows}
              bodyStates={bodyStates}
            />

            <DataViewToolbar pagination={pagination} />
          </DataView>

          <CreateRemoteModal
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
          />

          <Modal
            isOpen={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            variant="small"
          >
            <ModalHeader title="Delete Remote" />
            <ModalBody>
              Are you sure you want to delete remote &quot;{deleteTarget?.name}
              &quot;? This action cannot be undone.
            </ModalBody>
            <ModalFooter>
              <Button
                variant="danger"
                onClick={() => void handleDelete()}
                isLoading={deleteMutation.isPending}
              >
                Delete
              </Button>
              <Button variant="link" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
            </ModalFooter>
          </Modal>
        </PageSection>
      )}
    </>
  );
};

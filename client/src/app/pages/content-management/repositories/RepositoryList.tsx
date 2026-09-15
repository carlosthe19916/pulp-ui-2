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

import type { RepositoryResponse } from "@app/client";
import {
  computeActiveState,
  dataViewBodyStates,
} from "@app/components/DataView";
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
import { useFileRepositoryDeleteMutation } from "@app/queries/file-repositories";
import { useRepositoriesListQuery } from "@app/queries/repositories";
import { isForbiddenError } from "@app/utils/isHttpError";
import {
  extractIdFromHref,
  resolvePulpType,
} from "@app/queries/utils/pulpHref";
import { notifyTaskStarted } from "@app/utils/taskNotify";
import { getMutationErrorMessage } from "@app/utils/utils";

import { CreateRepositoryModal } from "./components/CreateRepositoryModal";
import { PublishModal } from "@app/components/PublishModal";
import { SyncModal } from "@app/components/SyncModal";

/**
 * The aggregation endpoint returns pulp_type at runtime but the generated
 * type does not include it. Extend the base type for list usage.
 */
type RepositoryRow = RepositoryResponse & { pulp_type?: string };

interface IRepositoryFilters {
  name: string;
  pulp_type: string;
}

function truncate(value: string | null | undefined, max = 40): string {
  if (!value) return "—";
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

export const RepositoryList: React.FC = () => {
  const [deleteTarget, setDeleteTarget] = useState<RepositoryRow | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [syncTarget, setSyncTarget] = useState<RepositoryRow | null>(null);
  const [publishRepoHref, setPublishRepoHref] = useState<string | null>(null);

  const { addNotification } = useNotifications();
  const plugins = use(ApiStatusContext)?.plugins ?? [];
  const deleteMutation = useFileRepositoryDeleteMutation();

  const { page, perPage, onSetPage, onPerPageSelect } = useDataViewPagination({
    perPage: 20,
  });
  const { filters, onSetFilters, clearAllFilters } =
    useDataViewFilters<IRepositoryFilters>({
      initialFilters: { name: "", pulp_type: "" },
    });

  const { data, isLoading, error } = useRepositoriesListQuery({
    limit: perPage,
    offset: (page - 1) * perPage,
    name__icontains: filters.name || undefined,
    pulp_type: filters.pulp_type
      ? (filters.pulp_type as NonNullable<
          Parameters<typeof useRepositoriesListQuery>[0]
        >["pulp_type"])
      : undefined,
  });

  const repositories = (data?.results ?? []) as RepositoryRow[];
  const totalCount = data?.count ?? 0;

  const canCreate = getDescriptorsForKind("repository").some((d) =>
    d.isAvailable(plugins),
  );

  const columns = [
    "Name",
    "Description",
    "Type",
    "Remote",
    { cell: "", props: { screenReaderText: "Actions" } },
  ];

  const rows: DataViewTr[] = repositories.map((repository) => {
    const repoId = extractIdFromHref(repository.pulp_href ?? "");
    const pulpType = resolvePulpType(
      repository.pulp_type,
      repository.pulp_href,
    );
    const descriptor = pulpType
      ? getDescriptor("repository", pulpType)
      : undefined;

    return {
      id: repository.pulp_href,
      row: [
        {
          cell: repoId ? (
            <Link
              to="/content-management/repositories/$repoId"
              params={{ repoId }}
            >
              {repository.name}
            </Link>
          ) : (
            repository.name
          ),
          props: { dataLabel: "Name" },
        },
        {
          cell: truncate(repository.description),
          props: { dataLabel: "Description" },
        },
        {
          cell: pulpType ? (
            <PulpTypeLabel kind="repository" pulpType={pulpType} />
          ) : (
            "—"
          ),
          props: { dataLabel: "Type" },
        },
        {
          cell: truncate(repository.remote),
          props: { dataLabel: "Remote" },
        },
        {
          cell: !descriptor ? (
            <ReadOnlyBadge pulpType={pulpType} />
          ) : (
            <>
              {descriptor.supportsSync && (
                <Button
                  variant="link"
                  isInline
                  onClick={() => setSyncTarget(repository)}
                >
                  Sync
                </Button>
              )}
              {descriptor.supportsPublish && (
                <Button
                  variant="link"
                  isInline
                  onClick={() =>
                    setPublishRepoHref(repository.pulp_href ?? null)
                  }
                >
                  Publish
                </Button>
              )}
              <Button
                variant="link"
                isInline
                isDanger
                onClick={() => setDeleteTarget(repository)}
              >
                Delete
              </Button>
            </>
          ),
          props: { dataLabel: "Actions", isActionCell: true },
        },
      ],
    };
  });

  const activeState = computeActiveState({
    isLoading,
    isError: !!error,
    isEmpty: repositories.length === 0,
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
          `Repository "${deleteTarget.name}" delete started`,
        );
      }
    } catch (error) {
      addNotification({
        ...getMutationErrorMessage(error, "Failed to delete repository"),
        variant: "danger",
      });
    }
    setDeleteTarget(null);
  };

  return (
    <>
      <DocumentTitle title="Repositories" />
      {isForbiddenError(error) ? (
        <PageSection>
          <UnauthorizedState />
        </PageSection>
      ) : (
        <PageSection>
          <Content component={ContentVariants.h1}>Repositories</Content>

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
                    Create repository
                  </Button>
                ) : undefined
              }
              pagination={pagination}
            />

            <DataViewTable
              aria-label="Repositories table"
              columns={columns}
              rows={rows}
              bodyStates={dataViewBodyStates({
                empty: "No repositories found.",
              })}
            />

            <DataViewToolbar pagination={pagination} />
          </DataView>

          <CreateRepositoryModal
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
          />

          {syncTarget && (
            <SyncModal
              isOpen
              onClose={() => setSyncTarget(null)}
              repoHref={syncTarget.pulp_href ?? ""}
              remoteSuggestion={syncTarget.remote ?? undefined}
            />
          )}

          {publishRepoHref && (
            <PublishModal
              isOpen
              onClose={() => setPublishRepoHref(null)}
              repoHref={publishRepoHref}
            />
          )}

          <Modal
            isOpen={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            variant="small"
          >
            <ModalHeader title="Delete Repository" />
            <ModalBody>
              Are you sure you want to delete repository &quot;
              {deleteTarget?.name}&quot;? This action cannot be undone.
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

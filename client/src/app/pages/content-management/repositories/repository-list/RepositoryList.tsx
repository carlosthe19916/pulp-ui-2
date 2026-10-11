import type React from "react";
import { useState } from "react";

import { Link } from "@tanstack/react-router";

import {
  Button,
  Content,
  ContentVariants,
  PageSection,
  Pagination,
  PaginationVariant,
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
import { ActionsColumn, type IAction } from "@patternfly/react-table";

import type { RepositoryResponse } from "@app/client";
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import { dataViewBodyStates, useColumnSort } from "@app/components/DataView";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { DomainContextSelector } from "@app/components/DomainContextSelector";
import { EntityModal } from "@app/components/Entity/EntityModal";
import { PublishModal } from "@app/components/PublishModal";
import { PulpTypeLabel } from "@app/components/PulpTypeLabel";
import { SyncModal } from "@app/components/SyncModal";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { useEntityDelete } from "@app/hooks/useEntityDelete";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import { withId } from "@app/models/models";
import type { IRepositoryListParams } from "@app/queries/repositories";
import { useRepositoriesListQuery } from "@app/queries/repositories";
import { REPOSITORY_FAMILY } from "@app/queries/utils/families";
import type { OrderingField } from "@app/queries/utils/listParams";
import {
  extractIdFromHref,
  resolvePulpType,
} from "@app/queries/utils/pulpHref";
import { getEntityPlugin } from "@catalog";

const SORTABLE_COLUMN_KEYS = [
  "name",
  "description",
] as const satisfies readonly OrderingField<IRepositoryListParams>[];

interface IRepositoryFilters {
  name: IRepositoryListParams["name"];
  pulp_type: IRepositoryListParams["pulp_type"];
}

export const RepositoryList: React.FC = () => {
  const { name: pulpDomain } = useSelectedDomain();

  const [modalState, setModalState] = useState<
    "create" | RepositoryResponse | null
  >(null);
  const repositoryToEdit =
    modalState === "create" ? undefined : (modalState ?? undefined);

  const [deleteTarget, setDeleteTarget] = useState<RepositoryResponse | null>(
    null,
  );
  const [syncTarget, setSyncTarget] = useState<RepositoryResponse | null>(null);
  const [publishTarget, setPublishTarget] = useState<RepositoryResponse | null>(
    null,
  );

  const { deleteEntity, isDeleting } = useEntityDelete(REPOSITORY_FAMILY);

  const { page, perPage, onSetPage, onPerPageSelect } = useDataViewPagination({
    perPage: 10,
  });
  const { ordering, sortProps } = useColumnSort({
    columnKeys: SORTABLE_COLUMN_KEYS,
    initialSort: { sortBy: "name", direction: "asc" },
    onSortChange: () => onSetPage(undefined, 1),
  });

  const { filters, onSetFilters, clearAllFilters } =
    useDataViewFilters<IRepositoryFilters>({});
  const debouncedName = useDebouncedValue(filters.name);
  const debouncedPulpType = useDebouncedValue(filters.pulp_type);

  const { data, isLoading, error } = useRepositoriesListQuery({
    limit: perPage,
    offset: (page - 1) * perPage,
    ordering,
    name__icontains: debouncedName || undefined,
    pulp_type: debouncedPulpType || undefined,
  });

  const repositories = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  const columns = [
    {
      cell: "Name",
      props: {
        sort: sortProps("name"),
      },
    },
    {
      cell: "Description",
      props: {
        sort: sortProps("description"),
      },
    },
    "Type",
    "Remote",
    {
      cell: "",
      props: {
        screenReaderText: "Actions",
      },
    },
  ];

  const rows: DataViewTr[] = repositories.map((repository) => {
    const repoId = extractIdFromHref(repository.pulp_href ?? "");
    const pulpType = resolvePulpType(repository.pulp_href);
    // TODO replace getEntityPlugin for something better, it does not reflect the plugin schema
    const plugin = pulpType
      ? getEntityPlugin("repository", pulpType)
      : undefined;

    const actionItems: IAction[] = [
      {
        title: "Edit",
        onClick: () => setModalState(repository),
      },
    ];
    if (plugin && plugin.compatibleRemoteTypes.length > 0) {
      actionItems.push({
        title: "Sync",
        onClick: () => setSyncTarget(repository),
      });
    }
    if (plugin && plugin.compatiblePublicationTypes.length > 0) {
      actionItems.push({
        title: "Publish",
        onClick: () => setPublishTarget(repository),
      });
    }
    actionItems.push({
      title: "Delete",
      onClick: () => setDeleteTarget(repository),
    });

    return {
      id: repository.pulp_href,
      row: [
        {
          cell: repoId ? (
            <Link
              to="/content-management/$pulpDomain/repositories/$repoId"
              params={{ pulpDomain, repoId }}
            >
              {repository.name}
            </Link>
          ) : (
            repository.name
          ),
          props: { dataLabel: "Name" },
        },
        {
          cell: repository.description || "—",
          props: { dataLabel: "Description", modifier: "truncate" },
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
          cell: repository.remote || "—",
          props: { dataLabel: "Remote", modifier: "truncate" },
        },
        {
          cell: <ActionsColumn items={actionItems} />,
          props: { dataLabel: "Actions", isActionCell: true },
        },
      ],
    };
  });

  const { activeState, bodyStates } = dataViewBodyStates({
    columnCount: columns.length,
    isLoading: isLoading,
    error,
    isEmpty: repositories.length === 0,
    emptyState: (
      <TableEmptyState
        title="No repositories found"
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
    if (!deleteTarget || !deleteTarget.pulp_href) return;
    try {
      await deleteEntity({
        name: deleteTarget.name,
        pulp_href: deleteTarget.pulp_href,
      });
    } catch {
      // Notifications are handled in useEntityDelete.
    }
    setDeleteTarget(null);
  };

  return (
    <>
      <DocumentTitle title="Repositories" />
      <DomainContextSelector />
      <PageSection>
        <Content component={ContentVariants.h1}>Repositories</Content>

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
              <Button variant="primary" onClick={() => setModalState("create")}>
                Create repository
              </Button>
            }
            pagination={pagination(PaginationVariant.top)}
          />

          <DataViewTable
            aria-label="Repositories table"
            columns={columns}
            rows={rows}
            bodyStates={bodyStates}
          />

          <DataViewToolbar pagination={pagination(PaginationVariant.bottom)} />
        </DataView>

        <EntityModal
          config={REPOSITORY_FAMILY}
          isOpen={modalState !== null}
          entity={repositoryToEdit}
          onClose={() => setModalState(null)}
        />

        {syncTarget && (
          <SyncModal
            isOpen
            onClose={() => setSyncTarget(null)}
            repo={withId(
              extractIdFromHref(syncTarget.pulp_href ?? ""),
              syncTarget,
            )}
          />
        )}

        {publishTarget && (
          <PublishModal
            isOpen
            onClose={() => setPublishTarget(null)}
            repoHref={publishTarget.pulp_href ?? ""}
          />
        )}

        <ConfirmActionModal
          isOpen={!!deleteTarget}
          title="Delete Repository"
          body={`Are you sure you want to delete repository "${deleteTarget?.name}"? This action cannot be undone.`}
          isConfirming={isDeleting}
          onConfirm={() => void handleDelete()}
          onCancel={() => setDeleteTarget(null)}
        />
      </PageSection>
    </>
  );
};

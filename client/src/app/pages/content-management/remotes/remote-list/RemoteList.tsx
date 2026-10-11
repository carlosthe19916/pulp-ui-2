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
import { ActionsColumn } from "@patternfly/react-table";

import type { GenericRemoteResponse } from "@app/client";
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import { dataViewBodyStates, useColumnSort } from "@app/components/DataView";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { DomainContextSelector } from "@app/components/DomainContextSelector";
import { EntityModal } from "@app/components/Entity/EntityModal";
import { PulpTypeLabel } from "@app/components/PulpTypeLabel";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { useEntityDelete } from "@app/hooks/useEntityDelete";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import type { IRemoteListParams } from "@app/queries/remotes";
import { useRemotesListQuery } from "@app/queries/remotes";
import { REMOTE_FAMILY } from "@app/queries/utils/families";
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
  const { name: pulpDomain } = useSelectedDomain();

  const [modalState, setModalState] = useState<
    "create" | GenericRemoteResponse | null
  >(null);
  const remoteToEdit =
    modalState === "create" ? undefined : (modalState ?? undefined);

  const [deleteTarget, setDeleteTarget] =
    useState<GenericRemoteResponse | null>(null);

  const { deleteEntity, isDeleting } = useEntityDelete(REMOTE_FAMILY);

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

  const columns = [
    {
      cell: "Name",
      props: {
        sort: sortProps("name"),
      },
    },
    {
      cell: "URL",
      props: {
        sort: sortProps("url"),
      },
    },
    {
      cell: "Policy",
      props: {
        sort: sortProps("policy"),
      },
    },
    "Type",
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

    return {
      id: remote.pulp_href,
      row: [
        {
          cell: remoteId ? (
            <Link
              to="/content-management/$pulpDomain/remotes/$remoteId"
              params={{ pulpDomain, remoteId }}
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
          cell: (
            <ActionsColumn
              items={[
                {
                  title: "Edit",
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
              <Button variant="primary" onClick={() => setModalState("create")}>
                Create remote
              </Button>
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

        <EntityModal
          config={REMOTE_FAMILY}
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

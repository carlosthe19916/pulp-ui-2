import type React from "react";
import { use, useState } from "react";
import { Link } from "@tanstack/react-router";

import {
  Button,
  Content,
  ContentVariants,
  PageSection,
  Pagination,
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
  useDataViewSort,
  type DataViewTr,
} from "@patternfly/react-data-view";

import type { GenericRemoteResponse } from "@app/client";
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import {
  buildThSort,
  dataViewBodyStates,
  toOrderingParam,
} from "@app/components/DataView";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { PulpTypeLabel } from "@app/components/PulpTypeLabel";
import { ReadOnlyBadge } from "@app/components/ReadOnlyBadge";
import { ApiStatusContext } from "@app/context/ApiStatus/ApiStatusContext";
import {
  getDescriptor,
  getDescriptorsForKind,
} from "@app/descriptors/registry";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { useRemotesListQuery } from "@app/queries/remotes";
import {
  extractIdFromHref,
  resolvePulpType,
} from "@app/queries/utils/pulpHref";

import { RemoteModal } from "../components/RemoteModal";
import { useRemoteActions } from "./hooks/useRemoteActions";

/** The aggregation endpoint returns pulp_type at runtime but the generated type omits it. */
type RemoteRow = GenericRemoteResponse & { pulp_type?: string };

const COLUMN_KEYS = ["name", "url", "policy", "type", "actions"] as const;
type RemoteColumnKey = (typeof COLUMN_KEYS)[number];

interface IRemoteFilters {
  name: string;
  pulp_type: string;
}

export const RemoteList: React.FC = () => {
  const [deleteTarget, setDeleteTarget] = useState<RemoteRow | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const plugins = use(ApiStatusContext)?.plugins ?? [];
  const { deleteRemote, isDeleting } = useRemoteActions();

  const { page, perPage, onSetPage, onPerPageSelect } = useDataViewPagination({
    perPage: 10,
  });
  const { sortBy, direction, onSort } = useDataViewSort({
    initialSort: { sortBy: "name", direction: "asc" },
  });
  const { filters, onSetFilters, clearAllFilters } =
    useDataViewFilters<IRemoteFilters>({
      initialFilters: { name: "", pulp_type: "" },
    });
  const debouncedName = useDebouncedValue(filters.name);
  const debouncedPulpType = useDebouncedValue(filters.pulp_type);

  const ordering = toOrderingParam(sortBy, direction) as
    "name" | "-name" | "url" | "-url" | "policy" | "-policy";

  const { data, isLoading, error } = useRemotesListQuery({
    limit: perPage,
    offset: (page - 1) * perPage,
    ordering,
    name__icontains: debouncedName || undefined,
    pulp_type: debouncedPulpType
      ? (debouncedPulpType as NonNullable<
          Parameters<typeof useRemotesListQuery>[0]
        >["pulp_type"])
      : undefined,
  });

  const remotes = (data?.results ?? []) as RemoteRow[];
  const totalCount = data?.count ?? 0;

  const canCreate = getDescriptorsForKind("remote").some((d) =>
    d.isAvailable(plugins),
  );

  const sortProps = (columnKey: RemoteColumnKey) =>
    buildThSort({
      columnKeys: COLUMN_KEYS,
      columnKey,
      sortBy,
      direction,
      onSort: (event, sortedKey, newDirection) => {
        onSort(event, sortedKey, newDirection);
        onSetPage(undefined, 1);
      },
    });

  const columns = [
    { cell: "Name", props: { sort: sortProps("name") } },
    { cell: "URL", props: { sort: sortProps("url") } },
    { cell: "Policy", props: { sort: sortProps("policy") } },
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
            <ActionsColumn
              items={[
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
    if (!deleteTarget?.pulp_href) return;
    try {
      await deleteRemote(
        extractIdFromHref(deleteTarget.pulp_href),
        deleteTarget.name,
      );
    } catch {
      // Notifications are handled in useRemoteActions.
    }
    setDeleteTarget(null);
  };

  return (
    <>
      <DocumentTitle title="Remotes" />
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
                <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
                  Create remote
                </Button>
              ) : undefined
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
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
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

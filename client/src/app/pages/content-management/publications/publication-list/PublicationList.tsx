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
  DataViewTable,
  DataViewToolbar,
  useDataViewPagination,
  useDataViewSort,
  type DataViewTr,
} from "@patternfly/react-data-view";

import type { PublicationResponse } from "@app/client";
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import {
  buildThSort,
  dataViewBodyStates,
  toOrderingParam,
} from "@app/components/DataView";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { DomainContextSelector } from "@app/components/DomainContextSelector";
import { EntityModal } from "@app/components/Entity/EntityModal";
import { PulpTypeLabel } from "@app/components/PulpTypeLabel";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { getAvailablePlugins } from "@catalog";
import { PUBLICATION_FAMILY } from "@app/queries/utils/families";
import { ApiStatusContext } from "@app/context/ApiStatus/ApiStatusContext";
import { useEntityDelete } from "@app/hooks/useEntityDelete";
import { usePublicationsListQuery } from "@app/queries/publications";
import {
  extractIdFromHref,
  resolvePulpType,
} from "@app/queries/utils/pulpHref";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import { formatDateTime } from "@app/utils/utils";

/** The aggregation endpoint returns pulp_type at runtime but the generated type omits it. */
type PublicationRow = PublicationResponse & { pulp_type?: string };

const truncate = (value: string | null | undefined, max = 40): string => {
  if (!value) return "—";
  return value.length > max ? `${value.slice(0, max)}...` : value;
};

const COLUMN_KEYS = [
  "publication",
  "type",
  "repository_version",
  "pulp_created",
  "actions",
] as const;
type PublicationColumnKey = (typeof COLUMN_KEYS)[number];

export const PublicationList: React.FC = () => {
  const [deleteTarget, setDeleteTarget] = useState<PublicationRow | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const plugins = use(ApiStatusContext)?.plugins ?? [];
  const { deleteEntity, isDeleting } = useEntityDelete(PUBLICATION_FAMILY);
  const { name: pulpDomain } = useSelectedDomain();

  const { page, perPage, onSetPage, onPerPageSelect } = useDataViewPagination({
    perPage: 10,
  });
  const { sortBy, direction, onSort } = useDataViewSort({
    initialSort: { sortBy: "pulp_created", direction: "desc" },
  });

  const ordering = toOrderingParam(sortBy, direction) as
    "pulp_created" | "-pulp_created";

  const { data, isLoading, error } = usePublicationsListQuery({
    limit: perPage,
    offset: (page - 1) * perPage,
    ordering,
  });

  const publications = (data?.results ?? []) as PublicationRow[];
  const totalCount = data?.count ?? 0;

  const canCreate = getAvailablePlugins("publication", plugins).length > 0;

  const handleDelete = async () => {
    if (!deleteTarget?.pulp_href) return;
    try {
      await deleteEntity(deleteTarget);
    } catch {
      // Notifications are handled in useEntityDelete.
    }
    setDeleteTarget(null);
  };

  const sortProps = (columnKey: PublicationColumnKey) =>
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
    "Publication",
    "Type",
    "Repository Version",
    { cell: "Created", props: { sort: sortProps("pulp_created") } },
    {
      cell: "",
      props: {
        screenReaderText: "Actions",
      },
    },
  ];

  const rows: DataViewTr[] = publications.map((pub) => {
    const href = pub.pulp_href;
    const pubId = href ? extractIdFromHref(href) : "";
    const pulpType = resolvePulpType(pub.pulp_type, pub.pulp_href);
    const label = href ? `Publication ${pubId}` : "—";
    return {
      id: href,
      row: [
        {
          cell: pubId ? (
            <Link
              to="/content-management/$pulpDomain/publications/$pubId"
              params={{ pulpDomain, pubId }}
            >
              {label}
            </Link>
          ) : (
            label
          ),
          props: { dataLabel: "Publication" },
        },
        {
          cell: pulpType ? (
            <PulpTypeLabel kind="publication" pulpType={pulpType} />
          ) : (
            "—"
          ),
          props: { dataLabel: "Type" },
        },
        {
          cell: truncate(pub.repository_version ?? pub.repository),
          props: { dataLabel: "Repository Version" },
        },
        {
          cell: formatDateTime(pub.pulp_created) ?? "—",
          props: { dataLabel: "Created" },
        },
        {
          cell: (
            <ActionsColumn
              items={[
                {
                  title: "Delete",
                  onClick: () => setDeleteTarget(pub),
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
    isEmpty: publications.length === 0,
    emptyState: <TableEmptyState title="No publications found" />,
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

  return (
    <>
      <DocumentTitle title="Publications" />
      <DomainContextSelector />
      <PageSection>
        <Content component={ContentVariants.h1}>Publications</Content>

        <DataView activeState={activeState}>
          <DataViewToolbar
            actions={
              canCreate ? (
                <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
                  Create publication
                </Button>
              ) : undefined
            }
            pagination={pagination(PaginationVariant.top)}
          />

          <DataViewTable
            aria-label="Publications table"
            columns={columns}
            rows={rows}
            bodyStates={bodyStates}
          />

          <DataViewToolbar pagination={pagination(PaginationVariant.bottom)} />
        </DataView>

        <EntityModal
          config={PUBLICATION_FAMILY}
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
        />

        <ConfirmActionModal
          isOpen={!!deleteTarget}
          title="Delete Publication"
          body={
            deleteTarget?.pulp_href
              ? `Are you sure you want to delete publication "${extractIdFromHref(
                  deleteTarget.pulp_href,
                )}"? This action cannot be undone.`
              : "Are you sure you want to delete this publication? This action cannot be undone."
          }
          isConfirming={isDeleting}
          onConfirm={() => void handleDelete()}
          onCancel={() => setDeleteTarget(null)}
        />
      </PageSection>
    </>
  );
};

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
  DataViewTable,
  DataViewToolbar,
  useDataViewPagination,
  type DataViewTr,
} from "@patternfly/react-data-view";
import { ActionsColumn } from "@patternfly/react-table";

import type { PublicationResponse } from "@app/client";
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import {
  dataViewBodyStates,
  useColumnSort,
  type DataViewTh,
} from "@app/components/DataView";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { DomainContextSelector } from "@app/components/DomainContextSelector";
import { EntityModal } from "@app/components/Entity/EntityModal";
import { PulpTypeLabel } from "@app/components/PulpTypeLabel";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { useEntityDelete } from "@app/hooks/useEntityDelete";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import type { IPublicationListParams } from "@app/queries/publications";
import { usePublicationsListQuery } from "@app/queries/publications";
import { PUBLICATION_FAMILY } from "@app/queries/utils/families";
import type { OrderingField } from "@app/queries/utils/listParams";
import {
  extractIdFromHref,
  resolvePulpType,
} from "@app/queries/utils/pulpHref";
import { formatDateTime } from "@app/utils/utils";

const SORTABLE_COLUMN_KEYS = [
  "pulp_created",
] as const satisfies readonly OrderingField<IPublicationListParams>[];

export const PublicationList: React.FC = () => {
  const { name: pulpDomain } = useSelectedDomain();

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<PublicationResponse | null>(
    null,
  );

  const { deleteEntity, isDeleting } = useEntityDelete(PUBLICATION_FAMILY);

  const { page, perPage, onSetPage, onPerPageSelect } = useDataViewPagination({
    perPage: 10,
  });

  const { ordering, sortProps } = useColumnSort({
    columnKeys: SORTABLE_COLUMN_KEYS,
    initialSort: { sortBy: "pulp_created", direction: "desc" },
    onSortChange: () => onSetPage(undefined, 1),
  });

  const { data, isLoading, error } = usePublicationsListQuery({
    limit: perPage,
    offset: (page - 1) * perPage,
    ordering,
  });

  const publications = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  const columns: DataViewTh[] = [
    "Publication",
    "Type",
    "Repository Version",
    {
      cell: "Created",
      props: {
        sort: sortProps("pulp_created"),
      },
    },
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
    const pulpType = resolvePulpType(pub.pulp_href);
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
          cell: pulpType ? <PulpTypeLabel pulpType={pulpType} /> : "—",
          props: { dataLabel: "Type" },
        },
        {
          cell: pub.repository_version ?? pub.repository ?? "—",
          props: { dataLabel: "Repository Version", modifier: "truncate" },
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

  const handleDelete = async () => {
    if (!deleteTarget || !deleteTarget.pulp_href) return;
    try {
      await deleteEntity({
        name: extractIdFromHref(deleteTarget.pulp_href),
        pulp_href: deleteTarget.pulp_href,
      });
    } catch {
      // Notifications are handled in useEntityDelete.
    }
    setDeleteTarget(null);
  };

  return (
    <>
      <DocumentTitle title="Publications" />
      <DomainContextSelector />
      <PageSection>
        <Content component={ContentVariants.h1}>Publications</Content>

        <DataView activeState={activeState}>
          <DataViewToolbar
            actions={
              <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
                Create publication
              </Button>
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

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
import { PulpTypeLabel } from "@app/components/PulpTypeLabel";
import { ReadOnlyBadge } from "@app/components/ReadOnlyBadge";
import { ApiStatusContext } from "@app/context/ApiStatus/ApiStatusContext";
import {
  getDescriptor,
  getDescriptorsForKind,
} from "@app/descriptors/registry";
import { usePublicationsListQuery } from "@app/queries/publications";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";
import { formatDateTime } from "@app/utils/utils";

import { CreatePublicationModal } from "./components/CreatePublicationModal";
import { usePublicationActions } from "./hooks/usePublicationActions";

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
  const { deletePublication, isDeleting } = usePublicationActions();

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

  const canCreate = getDescriptorsForKind("publication").some((d) =>
    d.isAvailable(plugins),
  );

  const handleDelete = async () => {
    if (!deleteTarget?.pulp_href) return;
    const identifier = extractIdFromHref(deleteTarget.pulp_href);
    try {
      await deletePublication(identifier, identifier);
    } catch {
      // Notifications are handled in usePublicationActions.
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
    { cell: "", props: { screenReaderText: "Actions" } },
  ];

  const rows: DataViewTr[] = publications.map((pub) => {
    const pulpType = pub.pulp_type;
    const descriptor = pulpType
      ? getDescriptor("publication", pulpType)
      : undefined;
    const href = pub.pulp_href;
    const label = href ? `Publication ${extractIdFromHref(href)}` : "—";
    return {
      id: href,
      row: [
        {
          cell:
            descriptor && href ? (
              <Link
                to="/content-management/publications/$pubId"
                params={{ pubId: extractIdFromHref(href) }}
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
          cell: descriptor ? (
            <ActionsColumn
              items={[
                {
                  title: "Delete",
                  isDanger: true,
                  onClick: () => setDeleteTarget(pub),
                },
              ]}
            />
          ) : (
            <ReadOnlyBadge pulpType={pulpType} />
          ),
          props: { dataLabel: "Actions", isActionCell: true },
        },
      ],
    };
  });

  const { activeState, bodyStates } = dataViewBodyStates({
    loading: isLoading,
    error,
    empty: publications.length === 0,
    emptyState: "No publications found.",
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

        <CreatePublicationModal
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

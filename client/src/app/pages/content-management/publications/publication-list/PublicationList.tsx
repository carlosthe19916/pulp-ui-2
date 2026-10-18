import type React from "react";
import { useState } from "react";

import {
  Button,
  Content,
  ContentVariants,
  Flex,
  FlexItem,
  PageSection,
  PaginationVariant,
  Tooltip,
} from "@patternfly/react-core";
import {
  DataView,
  DataViewTable,
  DataViewToolbar,
  type DataViewTr,
  type ExpandableContent,
  useDataViewPagination,
} from "@patternfly/react-data-view";
import { ActionsColumn } from "@patternfly/react-table";

import type { PublicationResponse } from "@app/client";
import { useNotifications } from "@app/hooks/useNotifications";
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import {
  compoundExpansions,
  dataViewBodyStates,
  useColumnSort,
  type DataViewTh,
  ListPagination,
} from "@app/components/DataView";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { DomainContextSelector } from "@app/components/DomainContextSelector";
import { PendingCreatesStatus } from "@app/components/PendingCreatesStatus";
import { PublicationDetailPanel } from "./components/PublicationDetailPanel";
import { PublicationModal } from "./components/PublicationModal";
import { PulpTypeLabel } from "@app/components/PulpTypeLabel";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { useCreatablePlugins } from "@app/hooks/pluginForm/useCreatablePlugins";
import type { IPublicationListParams } from "@app/queries/publications";
import {
  usePublicationDeleteMutation,
  usePublicationsListQuery,
} from "@app/queries/publications";
import type { OrderingField } from "@app/queries/utils/listParams";
import {
  extractIdFromHref,
  resolvePulpType,
} from "@app/queries/utils/pulpHref";
import { formatDateTime, getMutationErrorMessage } from "@app/utils/utils";

const SORTABLE_COLUMN_KEYS = [
  "pulp_created",
] as const satisfies readonly OrderingField<IPublicationListParams>[];

export const PublicationList: React.FC = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<PublicationResponse | null>(
    null,
  );

  const { addNotification } = useNotifications();
  const canCreate = useCreatablePlugins("publication").length > 0;
  const deleteMutation = usePublicationDeleteMutation({
    onSuccess: (_data, { name }) =>
      addNotification({
        title: `Publication "${name}" deleted`,
        variant: "success",
      }),
    onError: (error, { name }) =>
      addNotification({
        ...getMutationErrorMessage({
          error,
          fallback: `Failed to delete publication "${name}"`,
        }),
        variant: "danger",
      }),
  });
  const isDeleting = deleteMutation.isPending;

  const pagination = useDataViewPagination({ perPage: 10 });

  const { ordering, sortProps } = useColumnSort({
    columnKeys: SORTABLE_COLUMN_KEYS,
    initialSort: { sortBy: "pulp_created", direction: "desc" },
    onSortChange: () => pagination.onSetPage(undefined, 1),
  });

  const { data, isLoading, error } = usePublicationsListQuery({
    params: {
      limit: pagination.perPage,
      offset: (pagination.page - 1) * pagination.perPage,
      ordering,
    },
  });

  const publications = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  const columns: DataViewTh[] = [
    { cell: "Publication", props: { width: 30 } },
    { cell: "Type", props: { width: 20 } },
    { cell: "Repository Version", props: { width: 35 } },
    { cell: "Created", props: { sort: sortProps("pulp_created"), width: 15 } },
    { cell: "", props: { screenReaderText: "Actions" } },
  ];

  const rows: DataViewTr[] = publications.map((pub) => {
    const href = pub.pulp_href;
    const pubId = href ? extractIdFromHref(href) : "";
    const pulpType = resolvePulpType(pub.pulp_href);
    return {
      id: href,
      row: [
        {
          cell: href ? `Publication ${pubId}` : "—",
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

  const PUBLICATION_COLUMN_INDEX = 0;
  const expandedRows: ExpandableContent[] = compoundExpansions({
    entities: publications,
    columnIndex: PUBLICATION_COLUMN_INDEX,
    rowId: (pub) => pub.pulp_href ?? "",
    render: (pub) => <PublicationDetailPanel publication={pub} />,
  });

  const { activeState, bodyStates } = dataViewBodyStates({
    columnCount: columns.length,
    isLoading: isLoading,
    error,
    isEmpty: publications.length === 0,
    emptyState: <TableEmptyState title="No publications found" />,
  });

  const handleDelete = () => {
    const target = deleteTarget;
    if (!target?.pulp_href) return;
    deleteMutation.mutate(
      {
        href: target.pulp_href,
        name: extractIdFromHref(target.pulp_href),
      },
      { onSuccess: () => setDeleteTarget(null) },
    );
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
              <Flex
                spaceItems={{ default: "spaceItemsMd" }}
                alignItems={{ default: "alignItemsCenter" }}
                flexWrap={{ default: "nowrap" }}
              >
                <FlexItem>
                  {canCreate ? (
                    <Button
                      variant="primary"
                      onClick={() => setIsCreateOpen(true)}
                    >
                      Create publication
                    </Button>
                  ) : (
                    <Tooltip content="No publication plugin is available. Install a content plugin (e.g. pulp_file) to create publications.">
                      <Button variant="primary" isAriaDisabled>
                        Create publication
                      </Button>
                    </Tooltip>
                  )}
                </FlexItem>
                <PendingCreatesStatus entityType="publication" />
              </Flex>
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
            aria-label="Publications table"
            columns={columns}
            rows={rows}
            bodyStates={bodyStates}
            isExpandable
            expandedRows={expandedRows}
            indexBy="id"
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

        <PublicationModal
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
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </PageSection>
    </>
  );
};

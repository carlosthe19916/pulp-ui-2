import type React from "react";
import { useState } from "react";

import { useNavigate } from "@tanstack/react-router";

import {
  Button,
  Content,
  ContentVariants,
  Flex,
  FlexItem,
  Label,
  PageSection,
  PaginationVariant,
  Tooltip,
} from "@patternfly/react-core";
import {
  DataView,
  DataViewTable,
  DataViewToolbar,
  type DataViewTr,
} from "@patternfly/react-data-view";
import { ActionsColumn } from "@patternfly/react-table";

import type { PublicationResponse } from "@app/client";
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import { dataViewBodyStates } from "@app/components/dataViewStates";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { DomainContextSelector } from "@app/components/DomainContextSelector";
import { ListPagination } from "@app/components/ListPagination";
import { PendingCreatesStatus } from "@app/components/PendingCreatesStatus";
import { ResourceHrefLink } from "@app/components/ResourceHrefLink";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { useCreatableTypes } from "@app/hooks/useCreatableTypes";
import { useNotifications } from "@app/hooks/useNotifications";
import { useObjectsPermissions } from "@app/hooks/useObjectPermissions";
import { usePersistentState } from "@app/hooks/usePersistentState";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import {
  usePublicationDeleteMutation,
  usePublicationsListQuery,
} from "@app/queries/publications";
import {
  extractIdFromHref,
  hasRoleEndpoints,
  resolvePulpType,
} from "@app/queries/utils/pulpHref";
import type { DataViewTh } from "@app/utils/dataViewTypes";
import { columnSort } from "@app/utils/sortHelpers";
import { formatDateTime, getMutationErrorMessage } from "@app/utils/utils";

import {
  PUBLICATION_LIST_STATE,
  SORTABLE_COLUMN_KEYS,
} from "./publicationListState";

export const PublicationList: React.FC = () => {
  const navigate = useNavigate();
  const { name: pulpDomain } = useSelectedDomain();

  const [deleteTarget, setDeleteTarget] = useState<PublicationResponse | null>(
    null,
  );

  const { addNotification } = useNotifications();
  const canCreate = useCreatableTypes("publication").length > 0;
  const deleteMutation = usePublicationDeleteMutation({
    onSuccess: (_data, { pulp_href }) =>
      addNotification({
        title: `Publication "${extractIdFromHref(pulp_href ?? "")}" deleted`,
        variant: "success",
      }),
    onError: (error, { pulp_href }) =>
      addNotification({
        ...getMutationErrorMessage({
          error,
          fallback: `Failed to delete publication "${extractIdFromHref(pulp_href ?? "")}"`,
        }),
        variant: "danger",
      }),
  });
  const isDeleting = deleteMutation.isPending;

  const [pagination, setPagination] = usePersistentState({
    ...PUBLICATION_LIST_STATE.pagination,
    storage: "url",
  });

  const [sort, setSort] = usePersistentState({
    ...PUBLICATION_LIST_STATE.sort,
    storage: "url",
  });
  const { ordering, sortProps } = columnSort({
    columnKeys: SORTABLE_COLUMN_KEYS,
    sort,
    onSort: (next) => {
      setSort(next);
      setPagination((prev) => ({ ...prev, page: 1 }));
    },
  });

  const { data, isLoading, error } = usePublicationsListQuery({
    params: {
      limit: pagination.perPage,
      offset: (pagination.page - 1) * pagination.perPage,
      ordering,
    },
  });

  const publications = data?.results ?? [];

  // Some types (hugging_face) have no role endpoints to read permissions from.
  const { disabledProps } = useObjectsPermissions({
    hrefs: publications
      .filter((item) => hasRoleEndpoints(item.pulp_href))
      .map((item) => item.pulp_href ?? ""),
  });
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
          cell: href ? (
            <ResourceHrefLink
              kind="publication"
              href={href}
              label={`Publication ${pubId}`}
            />
          ) : (
            "—"
          ),
          props: { dataLabel: "Publication" },
        },
        {
          cell: pulpType ? <Label color="blue">{pulpType}</Label> : "—",
          props: { dataLabel: "Type" },
        },
        {
          cell: pub.repository_version ? (
            <ResourceHrefLink
              kind="repositoryVersion"
              href={pub.repository_version}
            />
          ) : (
            <ResourceHrefLink kind="repository" href={pub.repository} />
          ),
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
                  ...disabledProps({ href: pub.pulp_href, verb: "delete" }),
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

  const handleDelete = () => {
    const target = deleteTarget;
    if (!target?.pulp_href) return;
    deleteMutation.mutate(target, { onSuccess: () => setDeleteTarget(null) });
  };

  return (
    <>
      <DocumentTitle title="Publications" />
      <DomainContextSelector />
      <PageSection>
        <Content component={ContentVariants.h1}>Publications</Content>
      </PageSection>
      <PageSection>
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
                      onClick={() =>
                        void navigate({
                          to: "/content-management/$pulpDomain/publications/create",
                          params: { pulpDomain },
                        })
                      }
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
                onPaginationChange={setPagination}
              />
            }
          />

          <DataViewTable
            aria-label="Publications table"
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
                onPaginationChange={setPagination}
              />
            }
          />
        </DataView>

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

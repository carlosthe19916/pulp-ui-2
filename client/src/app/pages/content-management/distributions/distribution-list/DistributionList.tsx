import type React from "react";
import { useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
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
  type TooltipProps,
} from "@patternfly/react-core";
import {
  DataView,
  DataViewFilters,
  DataViewTable,
  DataViewTextFilter,
  DataViewToolbar,
  type DataViewTr,
  type ExpandableContent,
} from "@patternfly/react-data-view";
import { ActionsColumn } from "@patternfly/react-table";

import type { DistributionResponse } from "@app/client";
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import { dataViewBodyStates } from "@app/components/dataViewStates";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { DomainContextSelector } from "@app/components/DomainContextSelector";
import { ListPagination } from "@app/components/ListPagination";
import { MultiSelectFilter } from "@app/components/MultiSelectFilter";
import { ObjectAccessModal } from "@app/components/ObjectAccessModal";
import { PendingCreatesStatus } from "@app/components/PendingCreatesStatus";
import { ResourceHrefLink } from "@app/components/ResourceHrefLink";
import { resourceTaskExpansions } from "@app/components/resourceTaskExpansions";
import { ResourceTaskStatus } from "@app/components/ResourceTaskStatus";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { useApiStatus } from "@app/hooks/useApiStatus";
import { useCreatableTypes } from "@app/hooks/useCreatableTypes";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { useNotifications } from "@app/hooks/useNotifications";
import { useObjectsPermissions } from "@app/hooks/useObjectPermissions";
import { usePageInRange } from "@app/hooks/usePageInRange";
import { usePersistentState } from "@app/hooks/usePersistentState";
import { useResourceTasks } from "@app/hooks/useResourceTasks";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import {
  distributionKeys,
  useDistributionDeleteMutation,
  useDistributionsListQuery,
} from "@app/queries/distributions";
import {
  extractIdFromHref,
  hasRoleEndpoints,
  resolvePulpType,
} from "@app/queries/utils/pulpHref";
import type { DataViewTh } from "@app/utils/dataViewTypes";
import { columnSort } from "@app/utils/sortHelpers";
import { notifyTaskStarted } from "@app/utils/taskNotify";
import { getMutationErrorMessage } from "@app/utils/utils";
import { getAvailableTypes } from "@catalog";
import { getEntityForm, getTypeLabel } from "@plugins";

import {
  DISTRIBUTION_LIST_STATE,
  SORTABLE_COLUMN_KEYS,
} from "./distributionListState";

// Read-only/unmodelled types (e.g. core.artifact) can't be edited or deleted here.
const UNAVAILABLE_TYPE_TOOLTIP: TooltipProps = {
  content: "This distribution's plugin type isn't available in the UI.",
};

// Some types (hugging_face, OpenPGP) have no role endpoints to manage access with.
const NO_ROLES_TOOLTIP: TooltipProps = {
  content: "This distribution type doesn't support access management.",
};

export const DistributionList: React.FC = () => {
  const { addNotification } = useNotifications();
  const queryClient = useQueryClient();

  const navigate = useNavigate();
  const { name: pulpDomain } = useSelectedDomain();
  const installed = useApiStatus().plugins;
  const typeOptions = getAvailableTypes({
    entity: "distribution",
    installed,
  }).map(({ pulpType }) => ({
    value: pulpType,
    label: getTypeLabel({ entity: "distribution", pulpType }),
  }));

  const [accessTarget, setAccessTarget] = useState<DistributionResponse | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<DistributionResponse | null>(
    null,
  );

  const canCreate = useCreatableTypes("distribution").length > 0;
  const deleteMutation = useDistributionDeleteMutation({
    onSuccess: (data, { name }) =>
      notifyTaskStarted({
        addNotification,
        taskHref: data.task,
        title: `Distribution "${name}" deletion started`,
      }),
    onError: (error, { name }) =>
      addNotification({
        ...getMutationErrorMessage({
          error,
          fallback: `Failed to delete distribution "${name}"`,
        }),
        variant: "danger",
      }),
  });
  const isDeleting = deleteMutation.isPending;

  const [pagination, setPagination] = usePersistentState({
    ...DISTRIBUTION_LIST_STATE.pagination,
    storage: "url",
  });
  const toFirstPage = () => setPagination((prev) => ({ ...prev, page: 1 }));

  const [sort, setSort] = usePersistentState({
    ...DISTRIBUTION_LIST_STATE.sort,
    storage: "url",
  });
  const { ordering, sortProps } = columnSort({
    columnKeys: SORTABLE_COLUMN_KEYS,
    sort,
    onSort: (next) => {
      setSort(next);
      toFirstPage();
    },
  });

  const [filters, setFilters] = usePersistentState({
    ...DISTRIBUTION_LIST_STATE.filters,
    storage: "url",
  });
  const clearAllFilters = () => {
    setFilters(DISTRIBUTION_LIST_STATE.filters.defaultValue);
    toFirstPage();
  };
  const debouncedName = useDebouncedValue({ value: filters.name });

  const { data, isLoading, error } = useDistributionsListQuery({
    params: {
      limit: pagination.perPage,
      offset: (pagination.page - 1) * pagination.perPage,
      ordering,
      name__icontains: debouncedName || undefined,
      pulp_type__in: filters.pulp_type.length ? filters.pulp_type : undefined,
    },
  });

  const distributions = data?.results ?? [];
  usePageInRange({ pagination, setPagination, count: data?.count });

  const { disabledProps } = useObjectsPermissions({
    hrefs: distributions
      .filter((item) => hasRoleEndpoints(item.pulp_href))
      .map((item) => item.pulp_href ?? ""),
  });
  const totalCount = data?.count ?? 0;

  const { getActiveCount, getTaskKinds } = useResourceTasks({
    entities: distributions,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: distributionKeys.list() });
    },
  });

  // Status is task-driven: show the column only when a distribution actually has an in-flight
  // task, so it isn't a column of dashes.
  const hasAnyActiveTask = distributions.some(
    (distribution) => getActiveCount(distribution.prn) > 0,
  );

  const columns: DataViewTh[] = [
    { cell: "Name", props: { sort: sortProps("name"), width: 25 } },
    { cell: "Base Path", props: { width: 25 } },
    { cell: "Type", props: { width: 15 } },
    { cell: "Repository", props: { width: 25 } },
    ...(hasAnyActiveTask
      ? [{ cell: "Status", props: { width: 10 } } satisfies DataViewTh]
      : []),
    { cell: "", props: { screenReaderText: "Actions" } },
  ];

  const rows: DataViewTr[] = distributions.map((distribution) => {
    const pulpType = resolvePulpType(distribution.pulp_href);
    // Unmodelled types (e.g. core.artifact) are read-only here, so Edit and Delete gate
    // on canEdit; access management instead needs the type's role endpoints.
    const canEdit = !!(
      pulpType &&
      getEntityForm({ entity: "distribution", pulpType, mode: "edit" })
    );
    const canManageRoles = hasRoleEndpoints(distribution.pulp_href);

    return {
      id: distribution.pulp_href,
      row: [
        {
          cell: (
            <ResourceHrefLink
              kind="distribution"
              href={distribution.pulp_href}
              label={distribution.name}
            />
          ),
          props: { dataLabel: "Name", modifier: "truncate" },
        },
        {
          cell: distribution.base_path || "—",
          props: { dataLabel: "Base Path", modifier: "truncate" },
        },
        {
          cell: pulpType ? <Label color="blue">{pulpType}</Label> : "—",
          props: { dataLabel: "Type" },
        },
        {
          cell: (
            <ResourceHrefLink
              kind="repository"
              href={distribution.repository}
            />
          ),
          props: { dataLabel: "Repository" },
        },
        ...(hasAnyActiveTask
          ? [
              {
                cell: (
                  <ResourceTaskStatus
                    count={getActiveCount(distribution.prn)}
                    kind={getTaskKinds(distribution.prn)[0]}
                  />
                ),
                props: { dataLabel: "Status" },
              },
            ]
          : []),
        {
          cell: (
            <ActionsColumn
              items={[
                {
                  title: "Edit",
                  isAriaDisabled: !canEdit,
                  tooltipProps: canEdit ? undefined : UNAVAILABLE_TYPE_TOOLTIP,
                  onClick: () =>
                    pulpType &&
                    void navigate({
                      to: "/content-management/$pulpDomain/distributions/$distributionType/$distributionId/edit",
                      params: {
                        pulpDomain,
                        distributionType: pulpType,
                        distributionId: extractIdFromHref(
                          distribution.pulp_href ?? "",
                        ),
                      },
                    }),
                  ...(canEdit
                    ? disabledProps({
                        href: distribution.pulp_href,
                        verb: "change",
                      })
                    : {}),
                },
                {
                  title: "Manage access",
                  isAriaDisabled: !canManageRoles,
                  tooltipProps: canManageRoles ? undefined : NO_ROLES_TOOLTIP,
                  onClick: () => setAccessTarget(distribution),
                  ...(canManageRoles
                    ? disabledProps({
                        href: distribution.pulp_href,
                        verb: "manage_roles",
                      })
                    : {}),
                },
                {
                  title: "Delete",
                  isAriaDisabled: !canEdit,
                  tooltipProps: canEdit ? undefined : UNAVAILABLE_TYPE_TOOLTIP,
                  onClick: () => setDeleteTarget(distribution),
                  ...(canEdit
                    ? disabledProps({
                        href: distribution.pulp_href,
                        verb: "delete",
                      })
                    : {}),
                },
              ]}
            />
          ),
          props: { dataLabel: "Actions", isActionCell: true },
        },
      ],
    };
  });

  const STATUS_COLUMN_INDEX = 4;
  const expandedRows: ExpandableContent[] = hasAnyActiveTask
    ? resourceTaskExpansions({
        entities: distributions,
        getActiveCount,
        statusColumnIndex: STATUS_COLUMN_INDEX,
      })
    : [];

  const { activeState, bodyStates } = dataViewBodyStates({
    columnCount: columns.length,
    isLoading: isLoading,
    error,
    isEmpty: distributions.length === 0,
    emptyState: (
      <TableEmptyState
        title="No distributions found"
        isFiltered={Boolean(debouncedName) || filters.pulp_type.length > 0}
        onClearFilters={clearAllFilters}
      />
    ),
  });

  const handleDelete = () => {
    const target = deleteTarget;
    if (!target?.pulp_href) return;
    deleteMutation.mutate(target, { onSuccess: () => setDeleteTarget(null) });
  };

  return (
    <>
      <DocumentTitle title="Distributions" />
      <DomainContextSelector />
      <PageSection>
        <Content component={ContentVariants.h1}>Distributions</Content>
      </PageSection>
      <PageSection>
        <DataView activeState={activeState}>
          <DataViewToolbar
            clearAllFilters={clearAllFilters}
            filters={
              <DataViewFilters
                onChange={(_key, newFilters) => {
                  setFilters((prev) => ({ ...prev, ...newFilters }));
                  toFirstPage();
                }}
                values={filters}
              >
                <DataViewTextFilter filterId="name" title="Name" />
                <MultiSelectFilter
                  filterId="pulp_type"
                  title="Type"
                  options={typeOptions}
                />
              </DataViewFilters>
            }
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
                          to: "/content-management/$pulpDomain/distributions/create",
                          params: { pulpDomain },
                        })
                      }
                    >
                      Create distribution
                    </Button>
                  ) : (
                    <Tooltip content="No distribution plugin is available. Install a content plugin (e.g. pulp_file) to create distributions.">
                      <Button variant="primary" isAriaDisabled>
                        Create distribution
                      </Button>
                    </Tooltip>
                  )}
                </FlexItem>
                <PendingCreatesStatus entityType="distribution" />
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
            aria-label="Distributions table"
            columns={columns}
            rows={rows}
            bodyStates={bodyStates}
            isExpandable={expandedRows.length > 0}
            expandedRows={expandedRows}
            indexBy="id"
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

        {accessTarget && (
          <ObjectAccessModal
            href={accessTarget.pulp_href ?? ""}
            name={accessTarget.name}
            onClose={() => setAccessTarget(null)}
          />
        )}

        <ConfirmActionModal
          isOpen={!!deleteTarget}
          title="Delete Distribution"
          body={`Are you sure you want to delete distribution "${deleteTarget?.name}"? This action cannot be undone.`}
          isConfirming={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </PageSection>
    </>
  );
};

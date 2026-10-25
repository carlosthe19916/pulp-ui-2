import type React from "react";
import { useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

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
  DataViewFilters,
  DataViewTable,
  DataViewTextFilter,
  DataViewToolbar,
  type DataViewTr,
  type ExpandableContent,
  useDataViewFilters,
  useDataViewPagination,
} from "@patternfly/react-data-view";
import { ActionsColumn } from "@patternfly/react-table";

import type { DistributionResponse } from "@app/client";
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import { dataViewBodyStates } from "@app/components/dataViewStates";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { DomainContextSelector } from "@app/components/DomainContextSelector";
import { ListPagination } from "@app/components/ListPagination";
import { ObjectAccessModal } from "@app/components/ObjectAccessModal";
import { PendingCreatesStatus } from "@app/components/PendingCreatesStatus";
import { PulpTypeLabel } from "@app/components/PulpTypeLabel";
import { ResourceHrefLink } from "@app/components/ResourceHrefLink";
import { resourceTaskExpansions } from "@app/components/resourceTaskExpansions";
import { ResourceTaskStatus } from "@app/components/ResourceTaskStatus";
import { RevealCellOnExpand } from "@app/components/RevealCellOnExpand";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { useCreatablePlugins } from "@app/hooks/pluginForm/useCreatablePlugins";
import { useColumnSort } from "@app/hooks/useColumnSort";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { useNotifications } from "@app/hooks/useNotifications";
import { useObjectsPermissions } from "@app/hooks/useObjectPermissions";
import { useResourceTasks } from "@app/hooks/useResourceTasks";
import type { IDistributionListParams } from "@app/queries/distributions";
import {
  distributionKeys,
  useDistributionDeleteMutation,
  useDistributionsListQuery,
} from "@app/queries/distributions";
import type { OrderingField } from "@app/queries/utils/listParams";
import { resolvePulpType } from "@app/queries/utils/pulpHref";
import type { DataViewTh } from "@app/utils/dataViewTypes";
import { notifyTaskStarted } from "@app/utils/taskNotify";
import { getMutationErrorMessage } from "@app/utils/utils";
import { getPlugin } from "@catalog";

import { DistributionDetailPanel } from "./components/DistributionDetailPanel";
import { DistributionModal } from "./components/DistributionModal";

const SORTABLE_COLUMN_KEYS = [
  "name",
] as const satisfies readonly OrderingField<IDistributionListParams>[];

interface IDistributionFilters {
  name: IDistributionListParams["name"];
  pulp_type: IDistributionListParams["pulp_type"];
}

export const DistributionList: React.FC = () => {
  const { addNotification } = useNotifications();
  const queryClient = useQueryClient();

  const [modalState, setModalState] = useState<
    "create" | DistributionResponse | null
  >(null);
  const distributionToEdit =
    modalState === "create" ? undefined : (modalState ?? undefined);

  const [accessTarget, setAccessTarget] = useState<DistributionResponse | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<DistributionResponse | null>(
    null,
  );

  const canCreate = useCreatablePlugins("distribution").length > 0;
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

  const pagination = useDataViewPagination({ perPage: 10 });

  const { ordering, sortProps } = useColumnSort({
    columnKeys: SORTABLE_COLUMN_KEYS,
    initialSort: { sortBy: "name", direction: "asc" },
    onSortChange: () => pagination.onSetPage(undefined, 1),
  });

  const { filters, onSetFilters, clearAllFilters } =
    useDataViewFilters<IDistributionFilters>({});
  const debouncedName = useDebouncedValue({ value: filters.name });
  const debouncedPulpType = useDebouncedValue({ value: filters.pulp_type });

  const { data, isLoading, error } = useDistributionsListQuery({
    params: {
      limit: pagination.perPage,
      offset: (pagination.page - 1) * pagination.perPage,
      ordering,
      name__icontains: debouncedName || undefined,
      pulp_type: debouncedPulpType || undefined,
    },
  });

  const distributions = data?.results ?? [];

  const { disabledProps } = useObjectsPermissions({
    hrefs: distributions.map((item) => item.pulp_href ?? ""),
  });
  const totalCount = data?.count ?? 0;

  const { getActiveCount, getTaskKinds } = useResourceTasks({
    entities: distributions,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: distributionKeys.list() });
    },
  });

  const columns: DataViewTh[] = [
    { cell: "Name", props: { sort: sortProps("name"), width: 25 } },
    { cell: "Base Path", props: { width: 30 } },
    { cell: "Type", props: { width: 20 } },
    { cell: "Repository", props: { width: 25 } },
    { cell: "Status" },
    { cell: "", props: { screenReaderText: "Actions" } },
  ];

  const rows: DataViewTr[] = distributions.map((distribution) => {
    const pulpType = resolvePulpType(distribution.pulp_href);
    const canEdit = !!(pulpType && getPlugin(pulpType)?.entities.distribution);

    return {
      id: distribution.pulp_href,
      row: [
        {
          cell: distribution.name,
          props: { dataLabel: "Name", modifier: "truncate" },
        },
        {
          cell: distribution.base_path || "—",
          props: { dataLabel: "Base Path", modifier: "truncate" },
        },
        {
          cell: pulpType ? <PulpTypeLabel pulpType={pulpType} /> : "—",
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
        {
          cell: (
            <ResourceTaskStatus
              count={getActiveCount(distribution.prn)}
              kind={getTaskKinds(distribution.prn)[0]}
            />
          ),
          props: { dataLabel: "Status" },
        },
        {
          cell: (
            <ActionsColumn
              items={[
                {
                  title: "Edit",
                  isAriaDisabled: !canEdit,
                  tooltipProps: canEdit
                    ? undefined
                    : {
                        content:
                          "This distribution's plugin type isn't available in the UI.",
                      },
                  onClick: () => setModalState(distribution),
                  ...(canEdit
                    ? disabledProps({
                        href: distribution.pulp_href,
                        verb: "change",
                      })
                    : {}),
                },
                {
                  title: "Manage access",
                  onClick: () => setAccessTarget(distribution),
                  ...disabledProps({
                    href: distribution.pulp_href,
                    verb: "manage_roles",
                  }),
                },
                {
                  title: "Delete",
                  onClick: () => setDeleteTarget(distribution),
                  ...disabledProps({
                    href: distribution.pulp_href,
                    verb: "delete",
                  }),
                },
              ]}
            />
          ),
          props: { dataLabel: "Actions", isActionCell: true },
        },
      ],
    };
  });

  const NAME_COLUMN_INDEX = 0;
  const STATUS_COLUMN_INDEX = 4;
  const expandedRows: ExpandableContent[] = [
    ...distributions.map((distribution) => ({
      rowId: distribution.pulp_href ?? "",
      columnId: NAME_COLUMN_INDEX,
      content: (
        <RevealCellOnExpand>
          {() => <DistributionDetailPanel distribution={distribution} />}
        </RevealCellOnExpand>
      ),
    })),
    ...resourceTaskExpansions({
      entities: distributions,
      getActiveCount,
      statusColumnIndex: STATUS_COLUMN_INDEX,
    }),
  ];

  const { activeState, bodyStates } = dataViewBodyStates({
    columnCount: columns.length,
    isLoading: isLoading,
    error,
    isEmpty: distributions.length === 0,
    emptyState: (
      <TableEmptyState
        title="No distributions found"
        isFiltered={Boolean(debouncedName || debouncedPulpType)}
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
                  onSetFilters(newFilters);
                  pagination.onSetPage(undefined, 1);
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
              <Flex
                spaceItems={{ default: "spaceItemsMd" }}
                alignItems={{ default: "alignItemsCenter" }}
                flexWrap={{ default: "nowrap" }}
              >
                <FlexItem>
                  {canCreate ? (
                    <Button
                      variant="primary"
                      onClick={() => setModalState("create")}
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
              />
            }
          />

          <DataViewTable
            aria-label="Distributions table"
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

        <DistributionModal
          isOpen={modalState !== null}
          entity={distributionToEdit}
          onClose={() => setModalState(null)}
        />

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

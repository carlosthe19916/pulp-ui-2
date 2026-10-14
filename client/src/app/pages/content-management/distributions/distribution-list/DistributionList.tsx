import type React from "react";
import { use, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import {
  Button,
  Content,
  ContentVariants,
  PageSection,
  Pagination,
  PaginationVariant,
  Tooltip,
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

import { getPlugin } from "@catalog";
import type { DistributionResponse } from "@app/client";
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import {
  dataViewBodyStates,
  useColumnSort,
  type DataViewTh,
} from "@app/components/DataView";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { DomainContextSelector } from "@app/components/DomainContextSelector";
import { DistributionModal } from "./components/DistributionModal";
import { useDistributionActions } from "./hooks/useDistributionActions";
import { EntityTaskStatus } from "@app/components/EntityTaskStatus";
import { PulpTypeLabel } from "@app/components/PulpTypeLabel";
import { ResourceHrefLink } from "@app/components/ResourceHrefLink";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { EntityTaskTrackerContext } from "@app/context/EntityTaskTracker/EntityTaskTrackerContext";
import { useNotifications } from "@app/context/useNotifications";
import { useCreatablePlugins } from "@app/hooks/pluginForm/useCreatablePlugins";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { useEntityTaskWatcher } from "@app/hooks/useEntityTaskWatcher";
import type { IDistributionListParams } from "@app/queries/distributions";
import {
  distributionKeys,
  useDistributionsListQuery,
} from "@app/queries/distributions";
import type { OrderingField } from "@app/queries/utils/listParams";
import {
  extractIdFromHref,
  resolvePulpType,
} from "@app/queries/utils/pulpHref";

const SORTABLE_COLUMN_KEYS = [
  "name",
] as const satisfies readonly OrderingField<IDistributionListParams>[];

interface IDistributionFilters {
  name: IDistributionListParams["name"];
  pulp_type: IDistributionListParams["pulp_type"];
}

export const DistributionList: React.FC = () => {
  const { tasksById } = use(EntityTaskTrackerContext);
  const { addNotification } = useNotifications();
  const queryClient = useQueryClient();

  const [modalState, setModalState] = useState<
    "create" | DistributionResponse | null
  >(null);
  const distributionToEdit =
    modalState === "create" ? undefined : (modalState ?? undefined);

  const [deleteTarget, setDeleteTarget] = useState<DistributionResponse | null>(
    null,
  );

  const canCreate = useCreatablePlugins("distribution").length > 0;
  const { deleteDistribution, isDeleting } = useDistributionActions();

  const { page, perPage, onSetPage, onPerPageSelect } = useDataViewPagination({
    perPage: 10,
  });

  const { ordering, sortProps } = useColumnSort({
    columnKeys: SORTABLE_COLUMN_KEYS,
    initialSort: { sortBy: "name", direction: "asc" },
    onSortChange: () => onSetPage(undefined, 1),
  });

  const { filters, onSetFilters, clearAllFilters } =
    useDataViewFilters<IDistributionFilters>({});
  const debouncedName = useDebouncedValue(filters.name);
  const debouncedPulpType = useDebouncedValue(filters.pulp_type);

  const { data, isLoading, error } = useDistributionsListQuery({
    limit: perPage,
    offset: (page - 1) * perPage,
    ordering,
    name__icontains: debouncedName || undefined,
    pulp_type: debouncedPulpType || undefined,
  });

  const distributions = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  useEntityTaskWatcher({
    entities: distributions,
    onFinishedState: ({ task, tracked, entity }) => {
      void queryClient.invalidateQueries({ queryKey: distributionKeys.list() });
      if (task.state === "failed" || task.state === "canceled") {
        addNotification({
          title: `Failed to ${tracked.kind} distribution "${entity.name}"`,
          variant: "danger",
        });
      }
    },
  });

  const columns: DataViewTh[] = [
    {
      cell: "Name",
      props: {
        sort: sortProps("name"),
        width: 25,
      },
    },
    {
      cell: "Base Path",
      props: {
        width: 30,
      },
    },
    {
      cell: "Type",
      props: {
        width: 20,
      },
    },
    {
      cell: "Repository",
      props: {
        width: 25,
      },
    },
    {
      cell: "",
      props: {
        screenReaderText: "Actions",
      },
    },
  ];

  const rows: DataViewTr[] = distributions.map((distribution) => {
    const distId = extractIdFromHref(distribution.pulp_href ?? "");
    const task = distId ? tasksById[distId] : undefined;
    const pulpType = resolvePulpType(distribution.pulp_href);
    const canEdit = !!(pulpType && getPlugin(pulpType)?.entities.distribution);

    return {
      id: distribution.pulp_href,
      row: [
        {
          cell: distribution.name,
          props: { dataLabel: "Name" },
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
          cell: task ? (
            <EntityTaskStatus kind={task.kind} />
          ) : (
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
                },
                {
                  title: "Delete",
                  onClick: () => setDeleteTarget(distribution),
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
    isEmpty: distributions.length === 0,
    emptyState: (
      <TableEmptyState
        title="No distributions found"
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
    const target = deleteTarget;
    if (!target?.pulp_href) return;
    try {
      // Wait for the 202 (task accepted) before closing; the row then shows "Deleting".
      await deleteDistribution(target);
      setDeleteTarget(null);
    } catch {
      // Error surfaced as a toast; keep the modal open.
    }
  };

  return (
    <>
      <DocumentTitle title="Distributions" />
      <DomainContextSelector />
      <PageSection>
        <Content component={ContentVariants.h1}>Distributions</Content>

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
              )
            }
            pagination={pagination(PaginationVariant.top)}
          />

          <DataViewTable
            aria-label="Distributions table"
            columns={columns}
            rows={rows}
            bodyStates={bodyStates}
          />

          <DataViewToolbar pagination={pagination(PaginationVariant.bottom)} />
        </DataView>

        <DistributionModal
          isOpen={modalState !== null}
          entity={distributionToEdit}
          onClose={() => setModalState(null)}
        />

        <ConfirmActionModal
          isOpen={!!deleteTarget}
          title="Delete Distribution"
          body={`Are you sure you want to delete distribution "${deleteTarget?.name}"? This action cannot be undone.`}
          isConfirming={isDeleting}
          onConfirm={() => void handleDelete()}
          onCancel={() => setDeleteTarget(null)}
        />
      </PageSection>
    </>
  );
};

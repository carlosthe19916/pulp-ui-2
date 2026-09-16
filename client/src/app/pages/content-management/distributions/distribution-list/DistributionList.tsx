import type React from "react";
import { use, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";

import {
  Button,
  Content,
  ContentVariants,
  PageSection,
  Pagination,
  PaginationVariant,
} from "@patternfly/react-core";
import { ActionsColumn, type IAction } from "@patternfly/react-table";
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

import type { DistributionResponse } from "@app/client";
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import {
  buildThSort,
  dataViewBodyStates,
  toOrderingParam,
} from "@app/components/DataView";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { PulpTypeLabel } from "@app/components/PulpTypeLabel";
import { ReadOnlyBadge } from "@app/components/ReadOnlyBadge";
import { ResourceHrefLink } from "@app/components/ResourceHrefLink";
import { ApiStatusContext } from "@app/context/ApiStatus/ApiStatusContext";
import {
  getDescriptor,
  getDescriptorsForKind,
} from "@app/descriptors/registry";
import { useDistributionsListQuery } from "@app/queries/distributions";
import { useRepositoriesListQuery } from "@app/queries/repositories";
import {
  extractIdFromHref,
  resolvePulpType,
} from "@app/queries/utils/pulpHref";

import { DistributionModal } from "../components/DistributionModal";
import { useDistributionActions } from "./hooks/useDistributionActions";

/**
 * The aggregation endpoint returns pulp_type at runtime but the generated
 * type does not include it. Extend the base type for list usage.
 */
type DistributionRow = DistributionResponse & { pulp_type?: string };

const COLUMN_KEYS = [
  "name",
  "base_path",
  "type",
  "repository",
  "actions",
] as const;
type DistributionColumnKey = (typeof COLUMN_KEYS)[number];

interface IDistributionFilters {
  name: string;
  pulp_type: string;
}

export const DistributionList: React.FC = () => {
  const [deleteTarget, setDeleteTarget] = useState<DistributionRow | null>(
    null,
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const navigate = useNavigate();
  const plugins = use(ApiStatusContext)?.plugins ?? [];
  const { deleteDistribution, isDeleting } = useDistributionActions();

  const { page, perPage, onSetPage, onPerPageSelect } = useDataViewPagination({
    perPage: 20,
  });
  const { sortBy, direction, onSort } = useDataViewSort({
    initialSort: { sortBy: "name", direction: "asc" },
  });
  const { filters, onSetFilters, clearAllFilters } =
    useDataViewFilters<IDistributionFilters>({
      initialFilters: { name: "", pulp_type: "" },
    });

  const ordering = toOrderingParam(sortBy, direction) as "name" | "-name";

  const { data, isLoading, error } = useDistributionsListQuery({
    limit: perPage,
    offset: (page - 1) * perPage,
    ordering,
    name__icontains: filters.name || undefined,
    pulp_type: filters.pulp_type
      ? (filters.pulp_type as NonNullable<
          Parameters<typeof useDistributionsListQuery>[0]
        >["pulp_type"])
      : undefined,
  });

  const distributions = (data?.results ?? []) as DistributionRow[];
  const totalCount = data?.count ?? 0;

  const { data: repositoriesData } = useRepositoriesListQuery({ limit: 100 });
  const repositoryNameByHref = useMemo(() => {
    const map: Record<string, string> = {};
    for (const repo of repositoriesData?.results ?? []) {
      if (repo.pulp_href && repo.name) {
        map[repo.pulp_href] = repo.name;
      }
    }
    return map;
  }, [repositoriesData?.results]);

  const canCreate = getDescriptorsForKind("distribution").some((d) =>
    d.isAvailable(plugins),
  );

  const sortProps = (columnKey: DistributionColumnKey) =>
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
    "Base Path",
    "Type",
    "Repository",
    { cell: "", props: { screenReaderText: "Actions" } },
  ];

  const rows: DataViewTr[] = distributions.map((distribution) => {
    const distId = extractIdFromHref(distribution.pulp_href ?? "");
    const pulpType = resolvePulpType(
      distribution.pulp_type,
      distribution.pulp_href,
    );
    const descriptor = pulpType
      ? getDescriptor("distribution", pulpType)
      : undefined;

    const actionItems: IAction[] = [];
    if (distId) {
      actionItems.push({
        title: "Browse",
        onClick: () =>
          void navigate({
            to: "/browse/$distributionId",
            params: { distributionId: distId },
          }),
      });
    }
    actionItems.push({
      title: "Delete",
      isDanger: true,
      onClick: () => setDeleteTarget(distribution),
    });

    return {
      id: distribution.pulp_href,
      row: [
        {
          cell: distId ? (
            <Link
              to="/content-management/distributions/$distId"
              params={{ distId }}
            >
              {distribution.name}
            </Link>
          ) : (
            distribution.name
          ),
          props: { dataLabel: "Name" },
        },
        {
          cell: distribution.base_path || "—",
          props: { dataLabel: "Base Path" },
        },
        {
          cell: pulpType ? (
            <PulpTypeLabel kind="distribution" pulpType={pulpType} />
          ) : (
            "—"
          ),
          props: { dataLabel: "Type" },
        },
        {
          cell: (
            <ResourceHrefLink
              kind="repository"
              href={distribution.repository}
              label={
                distribution.repository
                  ? repositoryNameByHref[distribution.repository]
                  : undefined
              }
            />
          ),
          props: { dataLabel: "Repository" },
        },
        {
          cell: !descriptor ? (
            <ReadOnlyBadge pulpType={pulpType} />
          ) : (
            <ActionsColumn items={actionItems} />
          ),
          props: { dataLabel: "Actions", isActionCell: true },
        },
      ],
    };
  });

  const { activeState, bodyStates } = dataViewBodyStates({
    loading: isLoading,
    error,
    empty: distributions.length === 0,
    emptyState: "No distributions found.",
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
      await deleteDistribution(deleteTarget.pulp_href, deleteTarget.name);
    } catch {
      // Notifications are handled in useDistributionActions.
    }
    setDeleteTarget(null);
  };

  return (
    <>
      <DocumentTitle title="Distributions" />
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
                <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
                  Create distribution
                </Button>
              ) : undefined
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
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
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

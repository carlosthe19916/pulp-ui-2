import type React from "react";
import { use, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";

import {
  Button,
  Content,
  ContentVariants,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  PageSection,
  Pagination,
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

import type { DistributionResponse } from "@app/client";
import {
  computeActiveState,
  dataViewBodyStates,
} from "@app/components/DataView";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { PulpTypeLabel } from "@app/components/PulpTypeLabel";
import { ReadOnlyBadge } from "@app/components/ReadOnlyBadge";
import { ResourceHrefLink } from "@app/components/ResourceHrefLink";
import { UnauthorizedState } from "@app/components/UnauthorizedState";
import { useNotifications } from "@app/context/useNotifications";
import { ApiStatusContext } from "@app/context/ApiStatus/ApiStatusContext";
import {
  getDescriptor,
  getDescriptorsForKind,
} from "@app/descriptors/registry";
import { useFileDistributionDeleteMutation } from "@app/queries/file-distributions";
import { useDistributionsListQuery } from "@app/queries/distributions";
import { useRepositoriesListQuery } from "@app/queries/repositories";
import { isForbiddenError } from "@app/utils/isHttpError";
import {
  extractIdFromHref,
  resolvePulpType,
} from "@app/queries/utils/pulpHref";
import { notifyTaskStarted } from "@app/utils/taskNotify";
import { getMutationErrorMessage } from "@app/utils/utils";

import { CreateDistributionModal } from "./components/CreateDistributionModal";

/**
 * The aggregation endpoint returns pulp_type at runtime but the generated
 * type does not include it. Extend the base type for list usage.
 */
type DistributionRow = DistributionResponse & { pulp_type?: string };

interface IDistributionFilters {
  name: string;
  pulp_type: string;
}

export const DistributionList: React.FC = () => {
  const [deleteTarget, setDeleteTarget] = useState<DistributionRow | null>(
    null,
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { addNotification } = useNotifications();
  const plugins = use(ApiStatusContext)?.plugins ?? [];
  const deleteMutation = useFileDistributionDeleteMutation();

  const { page, perPage, onSetPage, onPerPageSelect } = useDataViewPagination({
    perPage: 20,
  });
  const { filters, onSetFilters, clearAllFilters } =
    useDataViewFilters<IDistributionFilters>({
      initialFilters: { name: "", pulp_type: "" },
    });

  const { data, isLoading, error } = useDistributionsListQuery({
    limit: perPage,
    offset: (page - 1) * perPage,
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

  const columns = [
    "Name",
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
            <>
              {distId ? (
                <>
                  <Link
                    to="/browse/$distributionId"
                    params={{ distributionId: distId }}
                  >
                    Browse
                  </Link>{" "}
                </>
              ) : null}
              <Button
                variant="link"
                isInline
                isDanger
                onClick={() => setDeleteTarget(distribution)}
              >
                Delete
              </Button>
            </>
          ),
          props: { dataLabel: "Actions", isActionCell: true },
        },
      ],
    };
  });

  const activeState = computeActiveState({
    isLoading,
    isError: !!error,
    isEmpty: distributions.length === 0,
  });

  const pagination = (
    <Pagination
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
      const result = await deleteMutation.mutateAsync(deleteTarget.pulp_href);
      const taskHref = result?.task;
      if (taskHref) {
        notifyTaskStarted(
          addNotification,
          taskHref,
          `Distribution "${deleteTarget.name}" delete started`,
        );
      } else {
        addNotification({
          title: `Distribution "${deleteTarget.name}" deleted`,
          variant: "success",
        });
      }
    } catch (error) {
      addNotification({
        ...getMutationErrorMessage(error, "Failed to delete distribution"),
        variant: "danger",
      });
    }
    setDeleteTarget(null);
  };

  return (
    <>
      <DocumentTitle title="Distributions" />
      {isForbiddenError(error) ? (
        <PageSection>
          <UnauthorizedState />
        </PageSection>
      ) : (
        <PageSection>
          <Content component={ContentVariants.h1}>Distributions</Content>

          <DataView activeState={activeState}>
            <DataViewToolbar
              clearAllFilters={clearAllFilters}
              filters={
                <DataViewFilters
                  onChange={(_key, newFilters) => onSetFilters(newFilters)}
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
                    onClick={() => setIsCreateOpen(true)}
                  >
                    Create distribution
                  </Button>
                ) : undefined
              }
              pagination={pagination}
            />

            <DataViewTable
              aria-label="Distributions table"
              columns={columns}
              rows={rows}
              bodyStates={dataViewBodyStates({
                empty: "No distributions found.",
              })}
            />

            <DataViewToolbar pagination={pagination} />
          </DataView>

          <CreateDistributionModal
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
          />

          <Modal
            isOpen={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            variant="small"
          >
            <ModalHeader title="Delete Distribution" />
            <ModalBody>
              Are you sure you want to delete distribution &quot;
              {deleteTarget?.name}&quot;? This action cannot be undone.
            </ModalBody>
            <ModalFooter>
              <Button
                variant="danger"
                onClick={() => void handleDelete()}
                isLoading={deleteMutation.isPending}
              >
                Delete
              </Button>
              <Button variant="link" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
            </ModalFooter>
          </Modal>
        </PageSection>
      )}
    </>
  );
};

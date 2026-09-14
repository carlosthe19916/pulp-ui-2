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
  SearchInput,
  Spinner,
  TextInput,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core";

import type { DistributionResponse } from "@app/client";
import {
  DataTable,
  useDataTable,
  type AppColumnDef,
} from "@app/components/DataTable";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { LoadingWrapper } from "@app/components/LoadingWrapper";
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

export const DistributionList: React.FC = () => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [nameFilter, setNameFilter] = useState("");
  const [pulpTypeFilter, setPulpTypeFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DistributionRow | null>(
    null,
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { addNotification } = useNotifications();
  const plugins = use(ApiStatusContext)?.plugins ?? [];
  const deleteMutation = useFileDistributionDeleteMutation();

  const { data, isLoading, error } = useDistributionsListQuery({
    limit: perPage,
    offset: (page - 1) * perPage,
    name__icontains: nameFilter || undefined,
    pulp_type: pulpTypeFilter
      ? (pulpTypeFilter as NonNullable<
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

  const columns = useMemo<AppColumnDef<DistributionRow>[]>(
    () => [
      {
        id: "name",
        header: "Name",
        cell: ({ row }) => {
          const distId = extractIdFromHref(row.original.pulp_href ?? "");
          if (!distId) {
            return row.original.name;
          }
          return (
            <Link
              to="/content-management/distributions/$distId"
              params={{ distId }}
            >
              {row.original.name}
            </Link>
          );
        },
      },
      {
        id: "base_path",
        header: "Base Path",
        cell: ({ row }) => row.original.base_path || "—",
      },
      {
        id: "pulp_type",
        header: "Type",
        cell: ({ row }) => {
          const pulpType = resolvePulpType(
            row.original.pulp_type,
            row.original.pulp_href,
          );
          return pulpType ? (
            <PulpTypeLabel kind="distribution" pulpType={pulpType} />
          ) : (
            "—"
          );
        },
      },
      {
        id: "repository",
        header: "Repository",
        cell: ({ row }) => (
          <ResourceHrefLink
            kind="repository"
            href={row.original.repository}
            label={
              row.original.repository
                ? repositoryNameByHref[row.original.repository]
                : undefined
            }
          />
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const pulpType = resolvePulpType(
            row.original.pulp_type,
            row.original.pulp_href,
          );
          const descriptor = pulpType
            ? getDescriptor("distribution", pulpType)
            : undefined;

          if (!descriptor) {
            return <ReadOnlyBadge pulpType={pulpType} />;
          }

          const distId = extractIdFromHref(row.original.pulp_href ?? "");

          return (
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
                onClick={() => setDeleteTarget(row.original)}
              >
                Delete
              </Button>
            </>
          );
        },
      },
    ],
    [repositoryNameByHref],
  );

  const table = useDataTable({
    data: distributions,
    columns,
  });

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

          <Toolbar>
            <ToolbarContent>
              <ToolbarItem>
                <SearchInput
                  placeholder="Filter by name..."
                  value={nameFilter}
                  onChange={(_e, value) => {
                    setNameFilter(value);
                    setPage(1);
                  }}
                  onClear={() => {
                    setNameFilter("");
                    setPage(1);
                  }}
                />
              </ToolbarItem>
              <ToolbarItem>
                <TextInput
                  id="dist-pulp-type-filter"
                  aria-label="Filter by pulp type"
                  placeholder="pulp_type (e.g. file.file)"
                  value={pulpTypeFilter}
                  onChange={(_e, value) => {
                    setPulpTypeFilter(value);
                    setPage(1);
                  }}
                />
              </ToolbarItem>
              {canCreate && (
                <ToolbarItem>
                  <Button
                    variant="primary"
                    onClick={() => setIsCreateOpen(true)}
                  >
                    Create distribution
                  </Button>
                </ToolbarItem>
              )}
              <ToolbarItem variant="pagination">
                <Pagination
                  itemCount={totalCount}
                  perPage={perPage}
                  page={page}
                  onSetPage={(_e, p) => setPage(p)}
                  onPerPageSelect={(_e, pp) => {
                    setPerPage(pp);
                    setPage(1);
                  }}
                  isCompact
                />
              </ToolbarItem>
            </ToolbarContent>
          </Toolbar>

          <LoadingWrapper
            isFetching={isLoading}
            isFetchingState={<Spinner aria-label="Loading distributions" />}
          >
            <DataTable
              table={table}
              ariaLabel="Distributions table"
              isEmpty={distributions.length === 0}
              emptyStateContent="No distributions found."
            />
          </LoadingWrapper>

          <Pagination
            itemCount={totalCount}
            perPage={perPage}
            page={page}
            onSetPage={(_e, p) => setPage(p)}
            onPerPageSelect={(_e, pp) => {
              setPerPage(pp);
              setPage(1);
            }}
            variant="bottom"
          />

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

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
  Spinner,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core";

import type { PublicationResponse } from "@app/client";
import {
  DataTable,
  useDataTable,
  type AppColumnDef,
} from "@app/components/DataTable";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { LoadingWrapper } from "@app/components/LoadingWrapper";
import { PulpTypeLabel } from "@app/components/PulpTypeLabel";
import { ReadOnlyBadge } from "@app/components/ReadOnlyBadge";
import { UnauthorizedState } from "@app/components/UnauthorizedState";
import { useNotifications } from "@app/context/useNotifications";
import { ApiStatusContext } from "@app/context/ApiStatus/ApiStatusContext";
import {
  getDescriptor,
  getDescriptorsForKind,
} from "@app/descriptors/registry";
import { useFilePublicationDeleteMutation } from "@app/queries/file-publications";
import { usePublicationsListQuery } from "@app/queries/publications";
import { isForbiddenError } from "@app/utils/isHttpError";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";
import { formatDateTime, getMutationErrorMessage } from "@app/utils/utils";

import { CreatePublicationModal } from "./components/CreatePublicationModal";

/**
 * The aggregation endpoint returns pulp_type at runtime but the generated
 * type does not include it. Extend the base type for list usage.
 */
type PublicationRow = PublicationResponse & { pulp_type?: string };

function truncate(value: string | null | undefined, max = 40): string {
  if (!value) return "—";
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

export const PublicationList: React.FC = () => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [deleteTarget, setDeleteTarget] = useState<PublicationRow | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { addNotification } = useNotifications();
  const plugins = use(ApiStatusContext)?.plugins ?? [];
  const deleteMutation = useFilePublicationDeleteMutation();

  const { data, isLoading, error } = usePublicationsListQuery({
    limit: perPage,
    offset: (page - 1) * perPage,
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
      await deleteMutation.mutateAsync(deleteTarget.pulp_href);
      addNotification({
        title: `Publication "${identifier}" deleted`,
        variant: "success",
      });
    } catch (error) {
      addNotification({
        ...getMutationErrorMessage(error, "Failed to delete publication"),
        variant: "danger",
      });
    }
    setDeleteTarget(null);
  };

  const columns = useMemo<AppColumnDef<PublicationRow>[]>(
    () => [
      {
        id: "name",
        header: "Publication",
        cell: ({ row }) => {
          const pulpType = row.original.pulp_type;
          const descriptor = pulpType
            ? getDescriptor("publication", pulpType)
            : undefined;
          const href = row.original.pulp_href;
          const label = href ? `Publication ${extractIdFromHref(href)}` : "—";
          if (!descriptor || !href) {
            return label;
          }
          const pubId = extractIdFromHref(href);
          return (
            <Link
              to="/content-management/publications/$pubId"
              params={{ pubId }}
            >
              {label}
            </Link>
          );
        },
      },
      {
        id: "pulp_type",
        header: "Type",
        cell: ({ row }) => {
          const pulpType = row.original.pulp_type;
          return pulpType ? (
            <PulpTypeLabel kind="publication" pulpType={pulpType} />
          ) : (
            "—"
          );
        },
      },
      {
        id: "repository_version",
        header: "Repository Version",
        cell: ({ row }) =>
          truncate(row.original.repository_version ?? row.original.repository),
      },
      {
        id: "created",
        header: "Created",
        cell: ({ row }) => formatDateTime(row.original.pulp_created) ?? "—",
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const pulpType = row.original.pulp_type;
          const descriptor = pulpType
            ? getDescriptor("publication", pulpType)
            : undefined;

          if (!descriptor) {
            return <ReadOnlyBadge pulpType={pulpType} />;
          }

          return (
            <Button
              variant="link"
              isInline
              isDanger
              onClick={() => setDeleteTarget(row.original)}
            >
              Delete
            </Button>
          );
        },
      },
    ],
    [],
  );

  const table = useDataTable({
    data: publications,
    columns,
  });

  return (
    <>
      <DocumentTitle title="Publications" />
      {isForbiddenError(error) ? (
        <PageSection>
          <UnauthorizedState />
        </PageSection>
      ) : (
        <PageSection>
          <Content component={ContentVariants.h1}>Publications</Content>

          <Toolbar>
            <ToolbarContent>
              {canCreate && (
                <ToolbarItem>
                  <Button
                    variant="primary"
                    onClick={() => setIsCreateOpen(true)}
                  >
                    Create publication
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
            isFetchingState={<Spinner aria-label="Loading publications" />}
          >
            <DataTable
              table={table}
              ariaLabel="Publications table"
              isEmpty={publications.length === 0}
              emptyStateContent="No publications found."
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

          <CreatePublicationModal
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
          />

          <Modal
            isOpen={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            variant="small"
          >
            <ModalHeader title="Delete Publication" />
            <ModalBody>
              {deleteTarget?.pulp_href
                ? `Are you sure you want to delete publication "${extractIdFromHref(
                    deleteTarget.pulp_href,
                  )}"? This action cannot be undone.`
                : "Are you sure you want to delete this publication? This action cannot be undone."}
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

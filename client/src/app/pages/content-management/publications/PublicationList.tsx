import type React from "react";
import { use, useState } from "react";
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
  DataViewTable,
  DataViewToolbar,
  useDataViewPagination,
  type DataViewTr,
} from "@patternfly/react-data-view";

import type { PublicationResponse } from "@app/client";
import {
  computeActiveState,
  dataViewBodyStates,
} from "@app/components/DataView";
import { DocumentTitle } from "@app/components/DocumentTitle";
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
  const [deleteTarget, setDeleteTarget] = useState<PublicationRow | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { addNotification } = useNotifications();
  const plugins = use(ApiStatusContext)?.plugins ?? [];
  const deleteMutation = useFilePublicationDeleteMutation();

  const { page, perPage, onSetPage, onPerPageSelect } = useDataViewPagination({
    perPage: 20,
  });

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

  const columns = [
    "Publication",
    "Type",
    "Repository Version",
    "Created",
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
            <Button
              variant="link"
              isInline
              isDanger
              onClick={() => setDeleteTarget(pub)}
            >
              Delete
            </Button>
          ) : (
            <ReadOnlyBadge pulpType={pulpType} />
          ),
          props: { dataLabel: "Actions", isActionCell: true },
        },
      ],
    };
  });

  const activeState = computeActiveState({
    isLoading,
    isError: !!error,
    isEmpty: publications.length === 0,
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

          <DataView activeState={activeState}>
            <DataViewToolbar
              actions={
                canCreate ? (
                  <Button
                    variant="primary"
                    onClick={() => setIsCreateOpen(true)}
                  >
                    Create publication
                  </Button>
                ) : undefined
              }
              pagination={pagination}
            />

            <DataViewTable
              aria-label="Publications table"
              columns={columns}
              rows={rows}
              bodyStates={dataViewBodyStates({
                empty: "No publications found.",
              })}
            />

            <DataViewToolbar pagination={pagination} />
          </DataView>

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

import type React from "react";
import { useState } from "react";
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

import type { GroupResponse } from "@app/client";
import { dataViewBodyStates } from "@app/components/DataView";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { UnauthorizedState } from "@app/components/UnauthorizedState";
import { useNotifications } from "@app/context/useNotifications";
import {
  useGroupDeleteMutation,
  useGroupsListQuery,
} from "@app/queries/groups";
import { isForbiddenError } from "@app/utils/isHttpError";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";
import { getMutationErrorMessage } from "@app/utils/utils";

import { CreateGroupModal } from "./components/CreateGroupModal";

interface IGroupFilters {
  name: string;
}

export const GroupList: React.FC = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GroupResponse | null>(null);

  const { addNotification } = useNotifications();
  const deleteMutation = useGroupDeleteMutation();

  const { page, perPage, onSetPage, onPerPageSelect } = useDataViewPagination({
    perPage: 20,
  });
  const { filters, onSetFilters, clearAllFilters } =
    useDataViewFilters<IGroupFilters>({ initialFilters: { name: "" } });

  const { data, isLoading, error } = useGroupsListQuery({
    limit: perPage,
    offset: (page - 1) * perPage,
    ordering: "name",
    name__icontains: filters.name || undefined,
  });

  const groups = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  const columns = [
    "Name",
    { cell: "", props: { screenReaderText: "Actions" } },
  ];

  const rows: DataViewTr[] = groups.map((group) => {
    const groupId = extractIdFromHref(group.pulp_href ?? "");
    return {
      id: group.pulp_href,
      row: [
        {
          cell: (
            <Link to="/admin/groups/$groupId" params={{ groupId }}>
              {group.name}
            </Link>
          ),
          props: { dataLabel: "Name" },
        },
        {
          cell: (
            <Button
              variant="link"
              isDanger
              isInline
              onClick={() => setDeleteTarget(group)}
            >
              Delete
            </Button>
          ),
          props: { dataLabel: "Actions", isActionCell: true },
        },
      ],
    };
  });

  const { activeState, bodyStates } = dataViewBodyStates({
    loading: isLoading,
    error,
    empty: groups.length === 0,
    emptyState: "No groups found.",
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
      await deleteMutation.mutateAsync(deleteTarget.pulp_href);
      addNotification({
        title: `Group "${deleteTarget.name}" deleted`,
        variant: "success",
      });
    } catch (error) {
      addNotification({
        ...getMutationErrorMessage(error, "Failed to delete group"),
        variant: "danger",
      });
    }
    setDeleteTarget(null);
  };

  return (
    <>
      <DocumentTitle title="Groups" />
      {isForbiddenError(error) ? (
        <PageSection>
          <UnauthorizedState />
        </PageSection>
      ) : (
        <PageSection>
          <Content component={ContentVariants.h1}>Groups</Content>

          <DataView activeState={activeState}>
            <DataViewToolbar
              clearAllFilters={clearAllFilters}
              filters={
                <DataViewFilters
                  onChange={(_key, newFilters) => onSetFilters(newFilters)}
                  values={filters}
                >
                  <DataViewTextFilter filterId="name" title="Name" />
                </DataViewFilters>
              }
              actions={
                <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
                  Create Group
                </Button>
              }
              pagination={pagination}
            />

            <DataViewTable
              aria-label="Groups table"
              columns={columns}
              rows={rows}
              bodyStates={bodyStates}
            />

            <DataViewToolbar pagination={pagination} />
          </DataView>

          <CreateGroupModal
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
          />

          <Modal
            isOpen={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            variant="small"
          >
            <ModalHeader title="Delete Group" />
            <ModalBody>
              Are you sure you want to delete group &quot;{deleteTarget?.name}
              &quot;? This action cannot be undone.
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

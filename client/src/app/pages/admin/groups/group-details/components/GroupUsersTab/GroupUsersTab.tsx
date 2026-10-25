import type React from "react";
import { useState } from "react";

import { Link } from "@tanstack/react-router";

import { PaginationVariant } from "@patternfly/react-core";
import {
  DataView,
  DataViewTable,
  DataViewToolbar,
  type DataViewTr,
  useDataViewPagination,
} from "@patternfly/react-data-view";
import { ActionsColumn } from "@patternfly/react-table";

import type { GroupUserResponse } from "@app/client";
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import { dataViewBodyStates } from "@app/components/dataViewStates";
import { GatedButton } from "@app/components/GatedButton";
import { ListPagination } from "@app/components/ListPagination";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { useNotifications } from "@app/hooks/useNotifications";
import { useObjectPermissions } from "@app/hooks/useObjectPermissions";
import {
  useGroupUsersListQuery,
  useSuspenseGroupDetailQuery,
} from "@app/queries/groups";
import { useMembershipRemoveMutation } from "@app/queries/memberships";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";
import type { DataViewTh } from "@app/utils/dataViewTypes";
import { getMutationErrorMessage } from "@app/utils/utils";

import { AddGroupUserModal } from "./AddGroupUserModal";

interface IGroupUsersTabProps {
  groupHref: string;
}

export const GroupUsersTab: React.FC<IGroupUsersTabProps> = ({ groupHref }) => {
  const { data: group } = useSuspenseGroupDetailQuery({ href: groupHref });
  const { disabledProps } = useObjectPermissions({ href: groupHref });
  const { addNotification } = useNotifications();

  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<GroupUserResponse | null>(
    null,
  );

  const removeMutation = useMembershipRemoveMutation({
    onSuccess: (_data, { user, group }) =>
      addNotification({
        title: `User "${user.username}" removed from group "${group.name}"`,
        variant: "success",
      }),
    onError: (error, { user, group }) =>
      addNotification({
        ...getMutationErrorMessage({
          error,
          fallback: `Failed to remove user "${user.username}" from group "${group.name}"`,
        }),
        variant: "danger",
      }),
  });

  const pagination = useDataViewPagination({ perPage: 10 });
  // `groups_users_list` supports only limit/offset (no ordering or filters), so the
  // members table only pages.
  const { data, isLoading, error } = useGroupUsersListQuery({
    groupHref,
    params: {
      limit: pagination.perPage,
      offset: (pagination.page - 1) * pagination.perPage,
    },
  });
  const users = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  const columns: DataViewTh[] = [
    { cell: "Username" },
    { cell: "", props: { screenReaderText: "Actions" } },
  ];

  // Each member's `pulp_href` is the user's own `/users/{id}/` href.
  const rows: DataViewTr[] = users.map((user) => ({
    id: user.pulp_href,
    row: [
      {
        cell: user.pulp_href ? (
          <Link
            to="/admin/users/$userId"
            params={{ userId: extractIdFromHref(user.pulp_href) }}
          >
            {user.username}
          </Link>
        ) : (
          user.username
        ),
        props: { dataLabel: "Username" },
      },
      {
        cell: (
          <ActionsColumn
            items={[
              {
                title: "Remove",
                onClick: () => setRemoveTarget(user),
                ...disabledProps("change"),
              },
            ]}
          />
        ),
        props: { dataLabel: "Actions", isActionCell: true },
      },
    ],
  }));

  const handleRemove = () => {
    if (!removeTarget?.pulp_href) return;
    removeMutation.mutate(
      { user: removeTarget, group },
      { onSuccess: () => setRemoveTarget(null) },
    );
  };

  const { activeState, bodyStates } = dataViewBodyStates({
    columnCount: columns.length,
    isLoading,
    error,
    isEmpty: totalCount === 0,
    emptyState: <TableEmptyState title="No users in this group" />,
  });

  return (
    <>
      <DataView activeState={activeState}>
        <DataViewToolbar
          actions={
            <GatedButton
              variant="primary"
              onClick={() => setIsAddUserOpen(true)}
              {...disabledProps("change")}
            >
              Add User
            </GatedButton>
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
          aria-label="Group users table"
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
            />
          }
        />
      </DataView>

      <AddGroupUserModal
        isOpen={isAddUserOpen}
        groupHref={groupHref}
        onClose={() => setIsAddUserOpen(false)}
      />

      <ConfirmActionModal
        isOpen={!!removeTarget}
        title="Remove User"
        body={`Are you sure you want to remove user "${removeTarget?.username}" from group "${group.name}"?`}
        isConfirming={removeMutation.isPending}
        confirmLabel="Remove"
        confirmVariant="primary"
        onConfirm={handleRemove}
        onCancel={() => setRemoveTarget(null)}
      />
    </>
  );
};

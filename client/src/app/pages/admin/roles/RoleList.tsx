import type React from "react";
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";

import {
  Button,
  Content,
  ContentVariants,
  Label,
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

import type { RoleResponse } from "@app/client";
import {
  computeActiveState,
  dataViewBodyStates,
} from "@app/components/DataView";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { UnauthorizedState } from "@app/components/UnauthorizedState";
import { useNotifications } from "@app/context/useNotifications";
import { useRoleDeleteMutation, useRolesListQuery } from "@app/queries/roles";
import { isForbiddenError } from "@app/utils/isHttpError";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";
import { getMutationErrorMessage } from "@app/utils/utils";

import { CreateRoleModal } from "./components/CreateRoleModal";

/** Roles are namespaced like `<plugin>.<role_name>`; fall back to "other". */
function getRolePlugin(name: string): string {
  return name.includes(".") ? name.split(".")[0] : "other";
}

interface IRoleFilters {
  name: string;
  plugin: string;
}

export const RoleList: React.FC = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteRole, setDeleteRole] = useState<RoleResponse | null>(null);

  const { addNotification } = useNotifications();
  const deleteMutation = useRoleDeleteMutation();

  const { page, perPage, onSetPage, onPerPageSelect } = useDataViewPagination({
    perPage: 20,
  });
  const { filters, onSetFilters, clearAllFilters } =
    useDataViewFilters<IRoleFilters>({
      initialFilters: { name: "", plugin: "" },
    });

  const { data, isLoading, error } = useRolesListQuery({
    limit: perPage,
    offset: (page - 1) * perPage,
    name__icontains: filters.name || undefined,
  });

  // The `plugin` filter is derived client-side from the role name, so it filters
  // the current page in-memory and adjusts the reported total accordingly.
  const allRoles = useMemo(() => data?.results ?? [], [data?.results]);
  const roles = useMemo(
    () =>
      filters.plugin
        ? allRoles.filter((role) =>
            getRolePlugin(role.name)
              .toLowerCase()
              .includes(filters.plugin.toLowerCase()),
          )
        : allRoles,
    [allRoles, filters.plugin],
  );
  const totalCount = filters.plugin ? roles.length : (data?.count ?? 0);

  const columns = [
    "Name",
    "Plugin",
    "Description",
    "Permissions",
    "Locked",
    { cell: "", props: { screenReaderText: "Actions" } },
  ];

  const rows: DataViewTr[] = roles.map((role) => {
    const roleId = extractIdFromHref(role.pulp_href ?? "");
    const desc = role.description ?? "";
    return {
      id: role.pulp_href,
      row: [
        {
          cell: (
            <Link to="/admin/roles/$roleId" params={{ roleId }}>
              {role.name}
            </Link>
          ),
          props: { dataLabel: "Name" },
        },
        {
          cell: (
            <Label isCompact color="blue">
              {getRolePlugin(role.name)}
            </Label>
          ),
          props: { dataLabel: "Plugin" },
        },
        {
          cell: desc.length > 80 ? `${desc.slice(0, 80)}...` : desc || "—",
          props: { dataLabel: "Description" },
        },
        {
          cell: (role.permissions ?? []).length,
          props: { dataLabel: "Permissions" },
        },
        {
          cell: role.locked ? (
            <Label color="green" isCompact>
              Yes
            </Label>
          ) : (
            <Label color="grey" isCompact>
              No
            </Label>
          ),
          props: { dataLabel: "Locked" },
        },
        {
          cell: role.locked ? (
            "—"
          ) : (
            <Button
              variant="link"
              isInline
              isDanger
              onClick={() => setDeleteRole(role)}
            >
              Delete
            </Button>
          ),
          props: { dataLabel: "Actions", isActionCell: true },
        },
      ],
    };
  });

  const activeState = computeActiveState({
    isLoading,
    isError: !!error,
    isEmpty: roles.length === 0,
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
    if (!deleteRole?.pulp_href) return;
    try {
      await deleteMutation.mutateAsync(deleteRole.pulp_href);
      addNotification({
        title: `Role "${deleteRole.name}" deleted`,
        variant: "success",
      });
    } catch (error) {
      addNotification({
        ...getMutationErrorMessage(error, "Failed to delete role"),
        variant: "danger",
      });
    }
    setDeleteRole(null);
  };

  return (
    <>
      <DocumentTitle title="Roles" />
      {isForbiddenError(error) ? (
        <PageSection>
          <UnauthorizedState />
        </PageSection>
      ) : (
        <PageSection>
          <Content component={ContentVariants.h1}>Roles</Content>

          <DataView activeState={activeState}>
            <DataViewToolbar
              clearAllFilters={clearAllFilters}
              filters={
                <DataViewFilters
                  onChange={(_key, newFilters) => onSetFilters(newFilters)}
                  values={filters}
                >
                  <DataViewTextFilter filterId="name" title="Name" />
                  <DataViewTextFilter filterId="plugin" title="Plugin" />
                </DataViewFilters>
              }
              actions={
                <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
                  Create Role
                </Button>
              }
              pagination={pagination}
            />

            <DataViewTable
              aria-label="Roles table"
              columns={columns}
              rows={rows}
              bodyStates={dataViewBodyStates({ empty: "No roles found." })}
            />

            <DataViewToolbar pagination={pagination} />
          </DataView>

          <CreateRoleModal
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
          />

          <Modal
            isOpen={!!deleteRole}
            onClose={() => setDeleteRole(null)}
            variant="small"
          >
            <ModalHeader title="Delete Role" />
            <ModalBody>
              Are you sure you want to delete the role &quot;{deleteRole?.name}
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
              <Button variant="link" onClick={() => setDeleteRole(null)}>
                Cancel
              </Button>
            </ModalFooter>
          </Modal>
        </PageSection>
      )}
    </>
  );
};

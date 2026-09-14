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
  SearchInput,
  Spinner,
  TextInput,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core";
import type { RoleResponse } from "@app/client";
import {
  DataTable,
  useDataTable,
  type AppColumnDef,
} from "@app/components/DataTable";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { LoadingWrapper } from "@app/components/LoadingWrapper";
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

export const RoleList: React.FC = () => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [nameFilter, setNameFilter] = useState("");
  const [pluginFilter, setPluginFilter] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteRole, setDeleteRole] = useState<RoleResponse | null>(null);

  const { addNotification } = useNotifications();
  const deleteMutation = useRoleDeleteMutation();

  const { data, isLoading, error } = useRolesListQuery({
    limit: perPage,
    offset: (page - 1) * perPage,
    name__icontains: nameFilter || undefined,
  });

  const allRoles = useMemo(() => data?.results ?? [], [data?.results]);
  const roles = useMemo(
    () =>
      pluginFilter
        ? allRoles.filter((role) =>
            getRolePlugin(role.name)
              .toLowerCase()
              .includes(pluginFilter.toLowerCase()),
          )
        : allRoles,
    [allRoles, pluginFilter],
  );
  const totalCount = pluginFilter ? roles.length : (data?.count ?? 0);

  const columns = useMemo<AppColumnDef<RoleResponse>[]>(
    () => [
      {
        id: "name",
        header: "Name",
        cell: ({ row }) => {
          const roleId = extractIdFromHref(row.original.pulp_href ?? "");
          return (
            <Link to="/admin/roles/$roleId" params={{ roleId }}>
              {row.original.name}
            </Link>
          );
        },
      },
      {
        id: "plugin",
        header: "Plugin",
        cell: ({ row }) => (
          <Label isCompact color="blue">
            {getRolePlugin(row.original.name)}
          </Label>
        ),
      },
      {
        id: "description",
        header: "Description",
        cell: ({ row }) => {
          const desc = row.original.description ?? "";
          return desc.length > 80 ? `${desc.slice(0, 80)}...` : desc || "—";
        },
      },
      {
        id: "permissions",
        header: "Permissions",
        cell: ({ row }) => (row.original.permissions ?? []).length,
      },
      {
        id: "locked",
        header: "Locked",
        cell: ({ row }) =>
          row.original.locked ? (
            <Label color="green" isCompact>
              Yes
            </Label>
          ) : (
            <Label color="grey" isCompact>
              No
            </Label>
          ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) =>
          row.original.locked ? (
            "—"
          ) : (
            <Button
              variant="link"
              isInline
              isDanger
              onClick={() => setDeleteRole(row.original)}
            >
              Delete
            </Button>
          ),
      },
    ],
    [],
  );

  const table = useDataTable({
    data: roles,
    columns,
  });

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
                  id="role-plugin-filter"
                  aria-label="Filter by plugin"
                  placeholder="Filter by plugin (e.g. rpm)"
                  value={pluginFilter}
                  onChange={(_e, value) => {
                    setPluginFilter(value);
                    setPage(1);
                  }}
                />
              </ToolbarItem>
              <ToolbarItem>
                <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
                  Create Role
                </Button>
              </ToolbarItem>
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
            isFetchingState={<Spinner aria-label="Loading roles" />}
          >
            <DataTable
              table={table}
              ariaLabel="Roles table"
              isEmpty={roles.length === 0}
              emptyStateContent="No roles found."
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

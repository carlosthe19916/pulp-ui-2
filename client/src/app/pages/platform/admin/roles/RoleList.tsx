import type React from "react";
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";

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
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";

import type { RoleResponse } from "@app/client";
import { UnauthorizedState } from "@app/components/UnauthorizedState";
import { useNotifications } from "@app/context/useNotifications";
import { useRoleDeleteMutation, useRolesListQuery } from "@app/queries/roles";
import { isForbiddenError } from "@app/utils/isHttpError";
import { extractIdFromHref } from "@app/utils/pulpHref";

import { CreateRoleModal } from "./CreateRoleModal";

export const RoleList: React.FC = () => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [nameFilter, setNameFilter] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteRole, setDeleteRole] = useState<RoleResponse | null>(null);

  const { addNotification } = useNotifications();
  const deleteMutation = useRoleDeleteMutation();

  const { data, isLoading, error } = useRolesListQuery({
    limit: perPage,
    offset: (page - 1) * perPage,
    name__icontains: nameFilter || undefined,
  });

  const roles = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  const columns = useMemo<ColumnDef<RoleResponse>[]>(
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

  const table = useReactTable({
    data: roles,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  const handleDelete = async () => {
    if (!deleteRole?.pulp_href) return;
    try {
      await deleteMutation.mutateAsync(deleteRole.pulp_href);
      addNotification({
        title: `Role "${deleteRole.name}" deleted`,
        variant: "success",
      });
    } catch {
      addNotification({
        title: "Failed to delete role",
        variant: "danger",
      });
    }
    setDeleteRole(null);
  };

  if (isForbiddenError(error)) {
    return (
      <PageSection>
        <UnauthorizedState />
      </PageSection>
    );
  }

  return (
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

      {isLoading ? (
        <Spinner aria-label="Loading roles" />
      ) : (
        <Table aria-label="Roles table" variant="compact">
          <Thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <Tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <Th key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </Th>
                ))}
              </Tr>
            ))}
          </Thead>
          <Tbody>
            {table.getRowModel().rows.map((row) => (
              <Tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <Td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Td>
                ))}
              </Tr>
            ))}
            {roles.length === 0 && (
              <Tr>
                <Td colSpan={columns.length}>No roles found.</Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      )}

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
  );
};

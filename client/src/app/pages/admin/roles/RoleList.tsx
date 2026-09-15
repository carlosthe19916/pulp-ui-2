import type React from "react";
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";

import {
  Button,
  Content,
  ContentVariants,
  Label,
  PageSection,
  Pagination,
  PaginationVariant,
} from "@patternfly/react-core";
import { ActionsColumn } from "@patternfly/react-table";
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

import type { RoleResponse } from "@app/client";
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import {
  buildThSort,
  dataViewBodyStates,
  toOrderingParam,
} from "@app/components/DataView";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { useRolesListQuery } from "@app/queries/roles";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";

import { RoleCreateModal } from "./components/RoleModal";
import { useRoleActions } from "./hooks/useRoleActions";

/** Roles are namespaced like `<plugin>.<role_name>`; fall back to "other". */
const getRolePlugin = (name: string): string => {
  return name.includes(".") ? name.split(".")[0] : "other";
};

const COLUMN_KEYS = [
  "name",
  "plugin",
  "description",
  "permissions",
  "locked",
  "actions",
] as const;
type RoleColumnKey = (typeof COLUMN_KEYS)[number];

interface IRoleFilters {
  name: string;
  plugin: string;
}

export const RoleList: React.FC = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RoleResponse | null>(null);

  const { deleteRole, isDeleting } = useRoleActions();

  const { page, perPage, onSetPage, onPerPageSelect } = useDataViewPagination({
    perPage: 20,
  });
  const { sortBy, direction, onSort } = useDataViewSort({
    initialSort: { sortBy: "name", direction: "asc" },
  });
  const { filters, onSetFilters, clearAllFilters } =
    useDataViewFilters<IRoleFilters>({
      initialFilters: { name: "", plugin: "" },
    });

  const ordering = toOrderingParam(sortBy, direction) as
    "name" | "-name" | "locked" | "-locked";

  const { data, isLoading, error } = useRolesListQuery({
    limit: perPage,
    offset: (page - 1) * perPage,
    ordering,
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

  const sortProps = (columnKey: RoleColumnKey) =>
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
    "Plugin",
    "Description",
    "Permissions",
    { cell: "Locked", props: { sort: sortProps("locked") } },
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
            <ActionsColumn
              items={[
                {
                  title: "Delete",
                  isDanger: true,
                  onClick: () => setDeleteTarget(role),
                },
              ]}
            />
          ),
          props: { dataLabel: "Actions", isActionCell: true },
        },
      ],
    };
  });

  const { activeState, bodyStates } = dataViewBodyStates({
    loading: isLoading,
    error,
    empty: roles.length === 0,
    emptyState: "No roles found.",
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
      await deleteRole(deleteTarget.pulp_href, deleteTarget.name);
    } catch {
      // Notifications are handled in useRoleActions.
    }
    setDeleteTarget(null);
  };

  return (
    <>
      <DocumentTitle title="Roles" />
      <PageSection>
        <Content component={ContentVariants.h1}>Roles</Content>

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
                <DataViewTextFilter filterId="plugin" title="Plugin" />
              </DataViewFilters>
            }
            actions={
              <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
                Create Role
              </Button>
            }
            pagination={pagination(PaginationVariant.top)}
          />

          <DataViewTable
            aria-label="Roles table"
            columns={columns}
            rows={rows}
            bodyStates={bodyStates}
          />

          <DataViewToolbar pagination={pagination(PaginationVariant.bottom)} />
        </DataView>

        <RoleCreateModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
        />

        <ConfirmActionModal
          isOpen={!!deleteTarget}
          title="Delete Role"
          body={`Are you sure you want to delete the role "${deleteTarget?.name}"? This action cannot be undone.`}
          isConfirming={isDeleting}
          onConfirm={() => void handleDelete()}
          onCancel={() => setDeleteTarget(null)}
        />
      </PageSection>
    </>
  );
};

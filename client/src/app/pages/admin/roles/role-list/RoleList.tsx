import type React from "react";
import { useState } from "react";

import {
  Button,
  Content,
  ContentVariants,
  Label,
  MenuToggle,
  type MenuToggleElement,
  PageSection,
  Pagination,
  PaginationVariant,
  Select,
  SelectList,
  SelectOption,
  ToolbarItem,
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
import { TableEmptyState } from "@app/components/TableEmptyState";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { useRolesListQuery } from "@app/queries/roles";

import { RoleModal } from "./components/RoleModal";
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
}

const LOCKED_OPTIONS = [
  { value: "", label: "All roles" },
  { value: "true", label: "Locked" },
  { value: "false", label: "Unlocked" },
] as const;
type LockedFilter = (typeof LOCKED_OPTIONS)[number]["value"];

export const RoleList: React.FC = () => {
  const [modalState, setModalState] = useState<"create" | RoleResponse | null>(
    null,
  );
  const roleToEdit =
    modalState === "create" ? undefined : (modalState ?? undefined);
  const [deleteTarget, setDeleteTarget] = useState<RoleResponse | null>(null);
  const [lockedFilter, setLockedFilter] = useState<LockedFilter>("");
  const [isLockedOpen, setIsLockedOpen] = useState(false);

  const { deleteRole, isDeleting } = useRoleActions();

  const { page, perPage, onSetPage, onPerPageSelect } = useDataViewPagination({
    perPage: 10,
  });
  const { sortBy, direction, onSort } = useDataViewSort({
    initialSort: { sortBy: "name", direction: "asc" },
  });
  const { filters, onSetFilters, clearAllFilters } =
    useDataViewFilters<IRoleFilters>({
      initialFilters: { name: "" },
    });
  const debouncedName = useDebouncedValue(filters.name);

  const clearFilters = () => {
    clearAllFilters();
    setLockedFilter("");
    onSetPage(undefined, 1);
  };

  const ordering = toOrderingParam(sortBy, direction) as
    "name" | "-name" | "locked" | "-locked";

  const { data, isLoading, error } = useRolesListQuery({
    limit: perPage,
    offset: (page - 1) * perPage,
    ordering,
    name__icontains: debouncedName || undefined,
    locked: lockedFilter === "" ? undefined : lockedFilter === "true",
  });

  const roles = data?.results ?? [];
  const totalCount = data?.count ?? 0;

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
    {
      cell: "",
      props: {
        screenReaderText: "Actions",
      },
    },
  ];

  const rows: DataViewTr[] = roles.map((role) => {
    const desc = role.description ?? "";
    return {
      id: role.pulp_href,
      row: [
        {
          cell: role.name,
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
          cell: (
            <ActionsColumn
              items={[
                {
                  title: "Edit",
                  isAriaDisabled: role.locked,
                  tooltipProps: role.locked
                    ? { content: "Locked roles cannot be edited" }
                    : undefined,
                  onClick: () => setModalState(role),
                },
                {
                  title: "Delete",
                  isAriaDisabled: role.locked,
                  tooltipProps: role.locked
                    ? { content: "Locked roles cannot be deleted" }
                    : undefined,
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
    columnCount: columns.length,
    isLoading: isLoading,
    error,
    isEmpty: roles.length === 0,
    emptyState: (
      <TableEmptyState
        title="No roles found"
        isFiltered={Boolean(debouncedName || lockedFilter)}
        onClearFilters={clearFilters}
      />
    ),
  });

  const lockedSelect = (
    <ToolbarItem>
      <Select
        isOpen={isLockedOpen}
        selected={lockedFilter}
        onSelect={(_e, value) => {
          setLockedFilter((value as LockedFilter) ?? "");
          setIsLockedOpen(false);
          onSetPage(undefined, 1);
        }}
        onOpenChange={setIsLockedOpen}
        toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
          <MenuToggle
            ref={toggleRef}
            onClick={() => setIsLockedOpen(!isLockedOpen)}
            isExpanded={isLockedOpen}
          >
            {LOCKED_OPTIONS.find((o) => o.value === lockedFilter)?.label}
          </MenuToggle>
        )}
      >
        <SelectList>
          {LOCKED_OPTIONS.map((o) => (
            <SelectOption key={o.value || "all"} value={o.value}>
              {o.label}
            </SelectOption>
          ))}
        </SelectList>
      </Select>
    </ToolbarItem>
  );

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
      await deleteRole(deleteTarget);
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
            clearAllFilters={clearFilters}
            filters={
              <>
                <DataViewFilters
                  onChange={(_key, newFilters) => {
                    onSetFilters(newFilters);
                    onSetPage(undefined, 1);
                  }}
                  values={filters}
                >
                  <DataViewTextFilter filterId="name" title="Name" />
                </DataViewFilters>
                {lockedSelect}
              </>
            }
            actions={
              <Button variant="primary" onClick={() => setModalState("create")}>
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

        <RoleModal
          isOpen={modalState !== null}
          role={roleToEdit}
          onClose={() => setModalState(null)}
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

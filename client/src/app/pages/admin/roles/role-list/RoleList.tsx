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
  type DataViewTr,
} from "@patternfly/react-data-view";

import type { RoleResponse } from "@app/client";
import { dataViewBodyStates } from "@app/components/dataViewStates";
import { ListPagination } from "@app/components/ListPagination";
import { useColumnSort } from "@app/hooks/useColumnSort";
import { useNotifications } from "@app/hooks/useNotifications";
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import type { IRoleListParams } from "@app/queries/roles";
import { useRoleDeleteMutation, useRolesListQuery } from "@app/queries/roles";
import type { OrderingField } from "@app/queries/utils/listParams";
import type { DataViewTh } from "@app/utils/dataViewTypes";
import { getMutationErrorMessage } from "@app/utils/utils";

import { RoleModal } from "./components/RoleModal";

/** Roles are namespaced like `<plugin>.<role_name>`; fall back to "other". */
const getRolePlugin = (name: string): string => {
  return name.includes(".") ? name.split(".")[0] : "other";
};

const SORTABLE_COLUMN_KEYS = [
  "name",
  "locked",
] as const satisfies readonly OrderingField<IRoleListParams>[];

interface IRoleFilters {
  name: IRoleListParams["name"];
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

  const { addNotification } = useNotifications();
  const deleteMutation = useRoleDeleteMutation({
    onSuccess: (_data, { name }) =>
      addNotification({ title: `Role "${name}" deleted`, variant: "success" }),
    onError: (error, { name }) =>
      addNotification({
        ...getMutationErrorMessage({
          error,
          fallback: `Failed to delete role "${name}"`,
        }),
        variant: "danger",
      }),
  });
  const isDeleting = deleteMutation.isPending;

  const pagination = useDataViewPagination({ perPage: 10 });
  const { ordering, sortProps } = useColumnSort({
    columnKeys: SORTABLE_COLUMN_KEYS,
    initialSort: { sortBy: "name", direction: "asc" },
    onSortChange: () => pagination.onSetPage(undefined, 1),
  });
  const { filters, onSetFilters, clearAllFilters } =
    useDataViewFilters<IRoleFilters>({});
  const debouncedName = useDebouncedValue({ value: filters.name });

  const clearFilters = () => {
    clearAllFilters();
    setLockedFilter("");
    pagination.onSetPage(undefined, 1);
  };

  const { data, isLoading, error } = useRolesListQuery({
    params: {
      limit: pagination.perPage,
      offset: (pagination.page - 1) * pagination.perPage,
      ordering,
      name__icontains: debouncedName || undefined,
      locked: lockedFilter === "" ? undefined : lockedFilter === "true",
    },
  });

  const roles = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  const columns: DataViewTh[] = [
    { cell: "Name", props: { sort: sortProps("name"), width: 25 } },
    { cell: "Plugin", props: { width: 15 } },
    { cell: "Description", props: { width: 30 } },
    { cell: "Permissions", props: { width: 20 } },
    { cell: "Locked", props: { sort: sortProps("locked"), width: 10 } },
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
          cell: desc || "—",
          props: { dataLabel: "Description", modifier: "truncate" },
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
          pagination.onSetPage(undefined, 1);
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

  const handleDelete = () => {
    const target = deleteTarget;
    if (!target?.pulp_href) return;
    deleteMutation.mutate(target, { onSuccess: () => setDeleteTarget(null) });
  };

  return (
    <>
      <DocumentTitle title="Roles" />
      <PageSection>
        <Content component={ContentVariants.h1}>Roles</Content>
      </PageSection>
      <PageSection>
        <DataView activeState={activeState}>
          <DataViewToolbar
            clearAllFilters={clearFilters}
            filters={
              <>
                <DataViewFilters
                  onChange={(_key, newFilters) => {
                    onSetFilters(newFilters);
                    pagination.onSetPage(undefined, 1);
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
            pagination={
              <ListPagination
                variant={PaginationVariant.top}
                itemCount={totalCount}
                pagination={pagination}
              />
            }
          />

          <DataViewTable
            aria-label="Roles table"
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
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </PageSection>
    </>
  );
};

import type React from "react";
import { useState } from "react";

import {
  Button,
  Content,
  ContentVariants,
  Label,
  PageSection,
  PaginationVariant,
} from "@patternfly/react-core";
import {
  DataView,
  DataViewFilters,
  DataViewTable,
  DataViewTextFilter,
  DataViewToolbar,
  type DataViewTr,
} from "@patternfly/react-data-view";
import { ActionsColumn } from "@patternfly/react-table";

import type { ContentGuardResponse } from "@app/client";
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import { dataViewBodyStates } from "@app/components/dataViewStates";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { DomainContextSelector } from "@app/components/DomainContextSelector";
import { ListPagination } from "@app/components/ListPagination";
import { MultiSelectFilter } from "@app/components/MultiSelectFilter";
import { ObjectAccessModal } from "@app/components/ObjectAccessModal";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { useNotifications } from "@app/hooks/useNotifications";
import { useObjectsPermissions } from "@app/hooks/useObjectPermissions";
import { usePageInRange } from "@app/hooks/usePageInRange";
import { usePersistentState } from "@app/hooks/usePersistentState";
import {
  useContentGuardDeleteMutation,
  useContentGuardDetailQuery,
  useContentGuardsListQuery,
} from "@app/queries/content-guards";
import { hasRoleEndpoints } from "@app/queries/utils/pulpHref";
import type { DataViewTh } from "@app/utils/dataViewTypes";
import { columnSort } from "@app/utils/sortHelpers";
import { formatDateTime, getMutationErrorMessage } from "@app/utils/utils";
import { getContentGuardTypes } from "@plugins";

import { ContentGuardModal } from "./components/ContentGuardModal";
import {
  CONTENT_GUARD_LIST_STATE,
  SORTABLE_COLUMN_KEYS,
} from "./contentGuardListState";
import { guardTypeOf } from "./utils/guardTypes";

/** Content guards: who may download what a distribution serves. */
export const ContentGuardList: React.FC = () => {
  const { addNotification } = useNotifications();
  const [isCreating, setIsCreating] = useState(false);
  const [editHref, setEditHref] = useState<string | null>(null);
  const [accessTarget, setAccessTarget] = useState<ContentGuardResponse | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<ContentGuardResponse | null>(
    null,
  );
  // The aggregate list carries base fields only; editing reads the typed guard.
  const { data: editGuard } = useContentGuardDetailQuery({
    href: editHref ?? "",
  });

  const [pagination, setPagination] = usePersistentState({
    ...CONTENT_GUARD_LIST_STATE.pagination,
    storage: "url",
  });
  const toFirstPage = () => setPagination((prev) => ({ ...prev, page: 1 }));

  const [sort, setSort] = usePersistentState({
    ...CONTENT_GUARD_LIST_STATE.sort,
    storage: "url",
  });
  const { ordering, sortProps } = columnSort({
    columnKeys: SORTABLE_COLUMN_KEYS,
    sort,
    onSort: (next) => {
      setSort(next);
      toFirstPage();
    },
  });

  const [filters, setFilters] = usePersistentState({
    ...CONTENT_GUARD_LIST_STATE.filters,
    storage: "url",
  });
  const clearAllFilters = () => {
    setFilters(CONTENT_GUARD_LIST_STATE.filters.defaultValue);
    toFirstPage();
  };
  const debouncedName = useDebouncedValue({ value: filters.name });
  const { data, isLoading, error } = useContentGuardsListQuery({
    params: {
      limit: pagination.perPage,
      offset: (pagination.page - 1) * pagination.perPage,
      ordering,
      name__icontains: debouncedName || undefined,
      pulp_type__in: filters.pulp_type.length ? filters.pulp_type : undefined,
    },
  });
  const deleteMutation = useContentGuardDeleteMutation({
    onSuccess: (_data, { name }) =>
      addNotification({ title: `Guard "${name}" deleted`, variant: "success" }),
    onError: (err, { name }) =>
      addNotification({
        ...getMutationErrorMessage({
          error: err,
          fallback: `Failed to delete guard "${name}"`,
        }),
        variant: "danger",
      }),
  });

  const guards = data?.results ?? [];
  usePageInRange({ pagination, setPagination, count: data?.count });

  const { disabledProps } = useObjectsPermissions({
    hrefs: guards
      .filter((item) => hasRoleEndpoints(item.pulp_href))
      .map((item) => item.pulp_href ?? ""),
  });
  const totalCount = data?.count ?? 0;
  const columns: DataViewTh[] = [
    { cell: "Name", props: { sort: sortProps("name"), width: 25 } },
    { cell: "Type", props: { sort: sortProps("pulp_type"), width: 20 } },
    { cell: "Description", props: { width: 35 } },
    { cell: "Created", props: { sort: sortProps("pulp_created"), width: 20 } },
    { cell: "", props: { screenReaderText: "Actions" } },
  ];
  const rows: DataViewTr[] = guards.map((guard) => {
    const type = guardTypeOf(guard.pulp_href ?? "");
    return {
      id: guard.pulp_href,
      row: [
        { cell: guard.name, props: { dataLabel: "Name" } },
        {
          cell: <Label isCompact>{type?.label ?? "Unknown"}</Label>,
          props: { dataLabel: "Type" },
        },
        {
          cell: guard.description || "—",
          props: { dataLabel: "Description", modifier: "truncate" },
        },
        {
          cell: formatDateTime(guard.pulp_created) ?? "—",
          props: { dataLabel: "Created" },
        },
        {
          cell: (
            <ActionsColumn
              items={[
                {
                  title: "Edit",
                  onClick: () => setEditHref(guard.pulp_href ?? null),
                  isAriaDisabled: !type,
                  ...(type
                    ? disabledProps({ href: guard.pulp_href, verb: "change" })
                    : {}),
                },
                ...(type?.downloaderRole
                  ? [
                      {
                        title: "Manage access",
                        onClick: () => setAccessTarget(guard),
                        ...disabledProps({
                          href: guard.pulp_href,
                          verb: "manage_roles",
                        }),
                      },
                    ]
                  : []),
                {
                  title: "Delete",
                  onClick: () => setDeleteTarget(guard),
                  ...disabledProps({ href: guard.pulp_href, verb: "delete" }),
                },
              ]}
            />
          ),
          props: { dataLabel: "Actions", isActionCell: true },
        },
      ],
    };
  });

  const isFiltered = !!debouncedName || filters.pulp_type.length > 0;
  const { activeState, bodyStates } = dataViewBodyStates({
    columnCount: columns.length,
    isLoading,
    error,
    isEmpty: guards.length === 0,
    emptyState: (
      <TableEmptyState
        title="No content guards found"
        body="Attach a guard to a distribution to restrict who can download from it."
        isFiltered={isFiltered}
        onClearFilters={clearAllFilters}
      />
    ),
  });

  return (
    <>
      <DocumentTitle title="Content guards" />
      <DomainContextSelector />
      <PageSection>
        <Content component={ContentVariants.h1}>Content guards</Content>
        <Content component={ContentVariants.p}>
          A guard restricts who can download the content a distribution serves.
        </Content>
      </PageSection>
      <PageSection>
        <DataView activeState={activeState}>
          <DataViewToolbar
            clearAllFilters={clearAllFilters}
            filters={
              <DataViewFilters
                onChange={(_key, newFilters) => {
                  setFilters((prev) => ({ ...prev, ...newFilters }));
                  toFirstPage();
                }}
                values={filters}
              >
                <DataViewTextFilter filterId="name" title="Name" />
                <MultiSelectFilter
                  filterId="pulp_type"
                  title="Type"
                  options={getContentGuardTypes().map((type) => ({
                    value: type.pulpType,
                    label: type.label,
                  }))}
                />
              </DataViewFilters>
            }
            actions={
              <Button variant="primary" onClick={() => setIsCreating(true)}>
                Create content guard
              </Button>
            }
            pagination={
              <ListPagination
                variant={PaginationVariant.top}
                itemCount={totalCount}
                pagination={pagination}
                onPaginationChange={setPagination}
              />
            }
          />
          <DataViewTable
            aria-label="Content guards table"
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
                onPaginationChange={setPagination}
              />
            }
          />
        </DataView>
      </PageSection>

      {isCreating && <ContentGuardModal onClose={() => setIsCreating(false)} />}
      {editHref && editGuard && (
        <ContentGuardModal
          guard={editGuard}
          onClose={() => setEditHref(null)}
        />
      )}
      {accessTarget && (
        <ObjectAccessModal
          href={accessTarget.pulp_href ?? ""}
          name={accessTarget.name}
          onClose={() => setAccessTarget(null)}
        />
      )}
      <ConfirmActionModal
        isOpen={!!deleteTarget}
        title="Delete content guard"
        body={`Delete guard "${deleteTarget?.name}"? Distributions using it become public.`}
        isConfirming={deleteMutation.isPending}
        onConfirm={() =>
          deleteTarget &&
          deleteMutation.mutate(deleteTarget, {
            onSuccess: () => setDeleteTarget(null),
          })
        }
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
};

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
  useDataViewFilters,
  useDataViewPagination,
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
import { useColumnSort } from "@app/hooks/useColumnSort";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { useNotifications } from "@app/hooks/useNotifications";
import {
  type IContentGuardListParams,
  useContentGuardDeleteMutation,
  useContentGuardDetailQuery,
  useContentGuardsListQuery,
} from "@app/queries/content-guards";
import type { OrderingField } from "@app/queries/utils/listParams";
import type { DataViewTh } from "@app/utils/dataViewTypes";
import { formatDateTime, getMutationErrorMessage } from "@app/utils/utils";

import { ContentGuardModal } from "./components/ContentGuardModal";
import { GUARD_TYPES, guardTypeOf } from "./utils/guardTypes";

const SORTABLE_COLUMN_KEYS = [
  "name",
  "pulp_type",
  "pulp_created",
] as const satisfies readonly OrderingField<IContentGuardListParams>[];

interface IGuardFilters {
  name: string;
  pulp_type: string[];
}

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

  const pagination = useDataViewPagination({ perPage: 10 });
  const { ordering, sortProps } = useColumnSort({
    columnKeys: SORTABLE_COLUMN_KEYS,
    initialSort: { sortBy: "name", direction: "asc" },
    onSortChange: () => pagination.onSetPage(undefined, 1),
  });
  const { filters, onSetFilters, clearAllFilters } =
    useDataViewFilters<IGuardFilters>({
      initialFilters: { name: "", pulp_type: [] },
    });
  const debouncedName = useDebouncedValue({ value: filters.name });
  const { data, isLoading, error } = useContentGuardsListQuery({
    params: {
      limit: pagination.perPage,
      offset: (pagination.page - 1) * pagination.perPage,
      ordering,
      name__icontains: debouncedName || undefined,
      pulp_type__in: filters.pulp_type?.length
        ? (filters.pulp_type as IContentGuardListParams["pulp_type__in"])
        : undefined,
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
  const totalCount = data?.count ?? 0;
  const columns: DataViewTh[] = [
    { cell: "Name", props: { sort: sortProps("name") } },
    { cell: "Type", props: { sort: sortProps("pulp_type") } },
    { cell: "Description" },
    { cell: "Created", props: { sort: sortProps("pulp_created") } },
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
        { cell: guard.description || "—", props: { dataLabel: "Description" } },
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
                },
                ...(type?.hasAccess
                  ? [
                      {
                        title: "Manage access",
                        onClick: () => setAccessTarget(guard),
                      },
                    ]
                  : []),
                { title: "Delete", onClick: () => setDeleteTarget(guard) },
              ]}
            />
          ),
          props: { dataLabel: "Actions", isActionCell: true },
        },
      ],
    };
  });

  const isFiltered = !!debouncedName || !!filters.pulp_type?.length;
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
                  onSetFilters(newFilters);
                  pagination.onSetPage(undefined, 1);
                }}
                values={filters}
              >
                <DataViewTextFilter filterId="name" title="Name" />
                <MultiSelectFilter
                  filterId="pulp_type"
                  title="Type"
                  options={GUARD_TYPES.map((type) => ({
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

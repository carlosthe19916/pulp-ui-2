import type React from "react";
import { useState } from "react";

import {
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

import type { AccessPolicyResponse } from "@app/client";
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import { dataViewBodyStates } from "@app/components/dataViewStates";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { ListPagination } from "@app/components/ListPagination";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { TaskActionModal } from "@app/components/TaskActionModal";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { useNotifications } from "@app/hooks/useNotifications";
import { usePageInRange } from "@app/hooks/usePageInRange";
import { usePersistentState } from "@app/hooks/usePersistentState";
import { useSubmitError } from "@app/hooks/useSubmitError";
import {
  useAccessPoliciesListQuery,
  useAccessPolicyResetMutation,
  useAccessPolicyUpdateMutation,
} from "@app/queries/access-policies";
import type { DataViewTh } from "@app/utils/dataViewTypes";
import type { IEntityField } from "@app/utils/entityField";
import { buildDefaultValues } from "@app/utils/formSchema";
import { columnSort } from "@app/utils/sortHelpers";
import { getMutationErrorMessage } from "@app/utils/utils";

import {
  ACCESS_POLICY_LIST_STATE,
  SORTABLE_COLUMN_KEYS,
} from "./accessPolicyListState";

const POLICY_FIELDS: IEntityField[] = [
  {
    key: "statements",
    label: "Statements",
    type: "json",
    required: true,
    helpText: "The list of allow/deny statements evaluated for each request.",
  },
  {
    key: "creation_hooks",
    label: "Creation hooks",
    type: "json",
    helpText: "Roles granted when an object of this viewset is created.",
  },
  {
    key: "queryset_scoping",
    label: "Queryset scoping",
    type: "json",
    helpText: "How lists are narrowed to what the user may see.",
  },
];

/** Who may call each API endpoint (viewset); defaults come from the plugins. */
export const AccessPolicyList: React.FC = () => {
  const { addNotification } = useNotifications();
  const { submitError, setSubmitError, clearSubmitError } = useSubmitError();
  const [editTarget, setEditTarget] = useState<AccessPolicyResponse | null>(
    null,
  );
  const [resetTarget, setResetTarget] = useState<AccessPolicyResponse | null>(
    null,
  );
  const [pagination, setPagination] = usePersistentState({
    ...ACCESS_POLICY_LIST_STATE.pagination,
    storage: "url",
  });
  const toFirstPage = () => setPagination((prev) => ({ ...prev, page: 1 }));

  const [sort, setSort] = usePersistentState({
    ...ACCESS_POLICY_LIST_STATE.sort,
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
    ...ACCESS_POLICY_LIST_STATE.filters,
    storage: "url",
  });
  const clearAllFilters = () => {
    setFilters(ACCESS_POLICY_LIST_STATE.filters.defaultValue);
    toFirstPage();
  };
  const debouncedName = useDebouncedValue({ value: filters.viewset_name });
  const { data, isLoading, error } = useAccessPoliciesListQuery({
    params: {
      limit: pagination.perPage,
      offset: (pagination.page - 1) * pagination.perPage,
      ordering,
      viewset_name__icontains: debouncedName || undefined,
    },
  });
  const updateMutation = useAccessPolicyUpdateMutation({
    onSuccess: ({ viewset_name }) =>
      addNotification({
        title: `Policy "${viewset_name}" saved`,
        variant: "success",
      }),
    onError: (err) =>
      setSubmitError(
        getMutationErrorMessage({
          error: err,
          fallback: "Failed to save policy",
        }),
      ),
  });
  const resetMutation = useAccessPolicyResetMutation({
    onSuccess: ({ viewset_name }) =>
      addNotification({
        title: `Policy "${viewset_name}" reset to its default`,
        variant: "success",
      }),
    onError: (err) =>
      addNotification({
        ...getMutationErrorMessage({
          error: err,
          fallback: "Failed to reset policy",
        }),
        variant: "danger",
      }),
  });

  const policies = data?.results ?? [];
  usePageInRange({ pagination, setPagination, count: data?.count });
  const totalCount = data?.count ?? 0;
  const columns: DataViewTh[] = [
    { cell: "Viewset", props: { sort: sortProps("viewset_name"), width: 60 } },
    { cell: "Statements", props: { width: 20 } },
    { cell: "Status", props: { sort: sortProps("customized"), width: 20 } },
    { cell: "", props: { screenReaderText: "Actions" } },
  ];
  const rows: DataViewTr[] = policies.map((policy) => ({
    id: policy.pulp_href,
    row: [
      { cell: policy.viewset_name, props: { dataLabel: "Viewset" } },
      {
        cell: Array.isArray(policy.statements) ? policy.statements.length : 0,
        props: { dataLabel: "Statements" },
      },
      {
        cell: policy.customized ? (
          <Label color="orange" isCompact>
            Customized
          </Label>
        ) : (
          <Label isCompact>Default</Label>
        ),
        props: { dataLabel: "Status" },
      },
      {
        cell: (
          <ActionsColumn
            items={[
              { title: "Edit", onClick: () => setEditTarget(policy) },
              {
                title: "Reset to default",
                onClick: () => setResetTarget(policy),
                isAriaDisabled: !policy.customized,
                ...(policy.customized
                  ? {}
                  : { tooltipProps: { content: "Already the default." } }),
              },
            ]}
          />
        ),
        props: { dataLabel: "Actions", isActionCell: true },
      },
    ],
  }));
  const { activeState, bodyStates } = dataViewBodyStates({
    columnCount: columns.length,
    isLoading,
    error,
    isEmpty: policies.length === 0,
    emptyState: (
      <TableEmptyState
        title="No access policies found"
        isFiltered={!!debouncedName}
        onClearFilters={clearAllFilters}
      />
    ),
  });
  const closeEdit = () => {
    clearSubmitError();
    setEditTarget(null);
  };

  return (
    <>
      <DocumentTitle title="Access policies" />
      <PageSection>
        <Content component={ContentVariants.h1}>Access policies</Content>
        <Content component={ContentVariants.p}>
          Each policy decides who may call one API endpoint. Changing them is
          advanced; reset a policy to restore its plugin's default.
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
                <DataViewTextFilter filterId="viewset_name" title="Viewset" />
              </DataViewFilters>
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
            aria-label="Access policies table"
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

      {editTarget && (
        <TaskActionModal
          title={`Edit policy "${editTarget.viewset_name}"`}
          submitLabel="Save"
          fields={POLICY_FIELDS}
          initialValues={buildDefaultValues({
            fields: POLICY_FIELDS,
            source: editTarget,
          })}
          isSubmitting={updateMutation.isPending}
          submitError={submitError}
          onSubmit={(body) => {
            clearSubmitError();
            updateMutation.mutate(
              { href: editTarget.pulp_href ?? "", body },
              { onSuccess: closeEdit },
            );
          }}
          onClose={closeEdit}
        />
      )}
      <ConfirmActionModal
        isOpen={!!resetTarget}
        title="Reset access policy"
        body={`Restore "${resetTarget?.viewset_name}" to its default? Your changes to it are lost.`}
        confirmLabel="Reset"
        confirmVariant="primary"
        isConfirming={resetMutation.isPending}
        onConfirm={() =>
          resetTarget &&
          resetMutation.mutate(resetTarget, {
            onSuccess: () => setResetTarget(null),
          })
        }
        onCancel={() => setResetTarget(null)}
      />
    </>
  );
};

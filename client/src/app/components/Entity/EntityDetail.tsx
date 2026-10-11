import { type ReactNode, useState } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  PageSection,
  Stack,
  StackItem,
} from "@patternfly/react-core";
import { PageHeader } from "@patternfly/react-component-groups/dist/dynamic/PageHeader";

import { getEntityLabel } from "@catalog";
import type { AsyncOperationResponse } from "@app/client";
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { EntityModal } from "@app/components/Entity/EntityModal";
import {
  PageHeaderActionsMenu,
  type PageHeaderAction,
} from "@app/components/PageHeaderActionsMenu";
import type { IContentFamilyConfig } from "@app/queries/utils/families";
import { useEntityDetail } from "@app/hooks/useEntityDetail";
import { useMutationAction } from "@app/hooks/useMutationAction";
import { formatDateTime } from "@app/utils/utils";

/** The family's dedicated delete mutation, supplied by the route wrapper. */
interface IEntityDeleteMutation {
  mutateAsync: (href: string) => Promise<AsyncOperationResponse | void>;
  isPending: boolean;
}

interface IEntityDetailProps {
  config: IContentFamilyConfig;
  id: string;
  deleteMutation: IEntityDeleteMutation;
  /** Typed link back to the list (route wrapper owns the typed route). */
  listLink: ReactNode;
  /** Navigate back to the list after delete (typed in the route wrapper). */
  onDeleted: () => void;
}

/** Generic detail page for remotes/distributions/publications. */
export const EntityDetail = ({
  config,
  id,
  deleteMutation,
  listLink,
  onDeleted,
}: IEntityDetailProps) => {
  const { entity, plugin } = useEntityDetail(config, id);
  const { runAction } = useMutationAction();
  const label = getEntityLabel(config.kind);
  const title = entity.name ?? label;

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const isDeleting = deleteMutation.isPending;

  // A plugin is editable iff it exposes edit fields (publications are immutable).
  const canEdit =
    (plugin?.entities[config.kind]?.form.editFields.length ?? 0) > 0;

  const handleDelete = async () => {
    if (!entity.pulp_href) return;
    const href = entity.pulp_href;
    try {
      await runAction(() => deleteMutation.mutateAsync(href), {
        taskAware: true,
        taskTitle: `${label} "${title}" delete started`,
        successTitle: `${label} "${title}" deleted`,
        errorTitle: `Failed to delete ${label.toLowerCase()}`,
      });
      onDeleted();
    } catch {
      // Error surfaced as a toast; keep the modal open.
    }
  };

  const actions: (PageHeaderAction | false | null | undefined)[] = [
    canEdit && {
      key: "edit",
      dropdownItemProps: {
        children: "Edit",
        onClick: () => setIsEditOpen(true),
      },
    },
    {
      key: "delete",
      dropdownItemProps: {
        children: "Delete",
        onClick: () => setIsDeleteOpen(true),
      },
    },
  ];

  return (
    <>
      <DocumentTitle title={title} />
      <PageHeader
        title={title}
        breadcrumbs={
          <Breadcrumb>
            <BreadcrumbItem>{listLink}</BreadcrumbItem>
            <BreadcrumbItem isActive>{title}</BreadcrumbItem>
          </Breadcrumb>
        }
        actionMenu={<PageHeaderActionsMenu actions={actions} />}
      />

      <PageSection>
        <Stack hasGutter>
          <StackItem>
            <DescriptionList isHorizontal>
              {entity.name !== undefined && (
                <DescriptionListGroup>
                  <DescriptionListTerm>Name</DescriptionListTerm>
                  <DescriptionListDescription>
                    {entity.name}
                  </DescriptionListDescription>
                </DescriptionListGroup>
              )}
              <DescriptionListGroup>
                <DescriptionListTerm>Created</DescriptionListTerm>
                <DescriptionListDescription>
                  {formatDateTime(entity.pulp_created) ?? "—"}
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </StackItem>
        </Stack>
      </PageSection>

      {canEdit && (
        <EntityModal
          config={config}
          isOpen={isEditOpen}
          entity={entity}
          onClose={() => setIsEditOpen(false)}
        />
      )}

      <ConfirmActionModal
        isOpen={isDeleteOpen}
        title={`Delete ${label}`}
        body={`Are you sure you want to delete ${label.toLowerCase()} "${title}"? This action cannot be undone.`}
        isConfirming={isDeleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </>
  );
};

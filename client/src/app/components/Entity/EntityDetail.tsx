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
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { EntityModal } from "@app/components/Entity/EntityModal";
import {
  PageHeaderActionsMenu,
  type PageHeaderAction,
} from "@app/components/PageHeaderActionsMenu";
import type { IContentFamilyConfig } from "@app/queries/utils/families";
import { useEntityDelete } from "@app/hooks/useEntityDelete";
import { useEntityDetail } from "@app/hooks/useEntityDetail";
import { formatDateTime } from "@app/utils/utils";

interface IEntityDetailProps {
  config: IContentFamilyConfig;
  id: string;
  /** Typed link back to the list (route wrapper owns the typed route). */
  listLink: ReactNode;
  /** Navigate back to the list after delete (typed in the route wrapper). */
  onDeleted: () => void;
}

/** Generic detail page for remotes/distributions/publications. */
export const EntityDetail = ({
  config,
  id,
  listLink,
  onDeleted,
}: IEntityDetailProps) => {
  const { entity, plugin } = useEntityDetail(config, id);
  const label = getEntityLabel(config.kind);
  const title = entity.name ?? label;

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const { deleteEntity, isDeleting } = useEntityDelete(config);

  // A plugin is editable iff it exposes edit fields (publications are immutable).
  const canEdit =
    (plugin?.entities[config.kind]?.form.editFields.length ?? 0) > 0;

  const handleDelete = async () => {
    if (!entity.pulp_href) return;
    try {
      await deleteEntity({
        name: entity.name ?? "",
        pulp_href: entity.pulp_href,
      });
      onDeleted();
    } catch {
      // Notifications are handled in useEntityDelete.
    }
    setIsDeleteOpen(false);
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

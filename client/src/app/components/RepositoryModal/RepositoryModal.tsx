import { EntityModalBody } from "@app/components/EntityModalBody";
import { EntityModalShell } from "@app/components/EntityModalShell";
import { PluginTypeSelector } from "@app/components/PluginTypeSelector";
import type { IEntityForEdit } from "@app/hooks/pluginForm/useEntityForm";
import { usePluginTypeSelection } from "@app/hooks/pluginForm/usePluginTypeSelection";
import { useRepositoryDetailQuery } from "@app/queries/repositories";

import { useRepositoryForm } from "./useRepositoryForm";

interface IRepositoryModalInnerProps {
  entity?: IEntityForEdit;
  onClose: () => void;
}

const RepositoryModalInner = ({
  entity,
  onClose,
}: IRepositoryModalInnerProps) => {
  const { data: full, isLoading } = useRepositoryDetailQuery({
    href: entity?.pulp_href ?? "",
  });
  const effectiveEntity = full ?? entity;
  const isCreate = !entity;
  const {
    availablePlugins,
    selectedType,
    setSelectedType,
    selectedPlugin,
    useWizard,
  } = usePluginTypeSelection({ kind: "repository", entity });

  const { onSubmit, isSubmitting, submitError } = useRepositoryForm({
    plugin: selectedPlugin,
    entity: isCreate ? undefined : effectiveEntity,
    onClose,
  });

  const title = isCreate
    ? "Create Repository"
    : `Edit ${entity?.name ?? "Repository"}`;

  const typeSelector = isCreate ? (
    <PluginTypeSelector
      available={availablePlugins}
      selectedType={selectedType}
      onChange={setSelectedType}
    />
  ) : undefined;

  return (
    <EntityModalShell
      title={title}
      variant={useWizard ? "wizard" : "plain"}
      isDetailLoading={!isCreate && isLoading}
      isCreate={isCreate}
      onClose={onClose}
    >
      <EntityModalBody
        key={isCreate ? selectedType : (entity?.pulp_href ?? "edit")}
        kind="repository"
        plugin={selectedPlugin}
        entity={isCreate ? undefined : effectiveEntity}
        useWizard={useWizard}
        title={title}
        typeSelector={typeSelector}
        onClose={onClose}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
        submitError={submitError}
      />
    </EntityModalShell>
  );
};

interface IRepositoryModalProps {
  isOpen: boolean;
  entity?: IEntityForEdit;
  onClose: () => void;
}

/**
 * Create/edit modal for repositories; wizard vs plain follows the catalog. Passing an
 * `entity` selects edit mode; omitting it selects create mode. Only mounted while open
 * so the form re-initializes on each open (mirrors `UserModal`).
 */
export const RepositoryModal = ({
  isOpen,
  entity,
  onClose,
}: IRepositoryModalProps) =>
  isOpen ? <RepositoryModalInner entity={entity} onClose={onClose} /> : null;

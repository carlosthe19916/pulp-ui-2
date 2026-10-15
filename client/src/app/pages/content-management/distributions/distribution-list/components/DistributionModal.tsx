import { EntityModalBody } from "@app/components/PluginForm/EntityModalBody";
import { EntityModalShell } from "@app/components/PluginForm/EntityModalShell";
import { PluginTypeSelector } from "@app/components/PluginForm/PluginTypeSelector";
import { useDistributionForm } from "../hooks/useDistributionForm";
import type { IEntityForEdit } from "@app/hooks/pluginForm/useEntityForm";
import { usePluginTypeSelection } from "@app/hooks/pluginForm/usePluginTypeSelection";
import { useDistributionDetailQuery } from "@app/queries/distributions";

interface IDistributionModalInnerProps {
  entity?: IEntityForEdit;
  onClose: () => void;
}

const DistributionModalInner = ({
  entity,
  onClose,
}: IDistributionModalInnerProps) => {
  const { data: full, isLoading } = useDistributionDetailQuery({
    href: entity?.pulp_href ?? null,
  });
  const effectiveEntity = full ?? entity;
  const isCreate = !entity;
  const {
    availablePlugins,
    selectedType,
    setSelectedType,
    selectedPlugin,
    useWizard,
  } = usePluginTypeSelection({ kind: "distribution", entity });

  const { onSubmit, isSubmitting } = useDistributionForm({
    plugin: selectedPlugin,
    entity: isCreate ? undefined : effectiveEntity,
    onClose,
  });

  const title = isCreate
    ? "Create Distribution"
    : `Edit ${entity?.name ?? "Distribution"}`;

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
        kind="distribution"
        plugin={selectedPlugin}
        entity={isCreate ? undefined : effectiveEntity}
        useWizard={useWizard}
        title={title}
        typeSelector={typeSelector}
        onClose={onClose}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
      />
    </EntityModalShell>
  );
};

interface IDistributionModalProps {
  isOpen: boolean;
  entity?: IEntityForEdit;
  onClose: () => void;
}

/** Create/edit modal for distributions; wizard vs plain follows the catalog. */
export const DistributionModal = ({
  isOpen,
  entity,
  onClose,
}: IDistributionModalProps) =>
  isOpen ? <DistributionModalInner entity={entity} onClose={onClose} /> : null;

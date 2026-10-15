import { EntityModalBody } from "@app/components/PluginForm/EntityModalBody";
import { EntityModalShell } from "@app/components/PluginForm/EntityModalShell";
import { PluginTypeSelector } from "@app/components/PluginForm/PluginTypeSelector";
import type { IEntityForEdit } from "@app/hooks/pluginForm/useEntityForm";
import { usePluginTypeSelection } from "@app/hooks/pluginForm/usePluginTypeSelection";
import { useRemoteDetailQuery } from "@app/queries/remotes";

import { useRemoteForm } from "../hooks/useRemoteForm";

interface IRemoteModalInnerProps {
  entity?: IEntityForEdit;
  onClose: () => void;
}

const RemoteModalInner = ({ entity, onClose }: IRemoteModalInnerProps) => {
  const { data: full, isLoading } = useRemoteDetailQuery({
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
  } = usePluginTypeSelection({ kind: "remote", entity });

  const { onSubmit, isSubmitting } = useRemoteForm({
    plugin: selectedPlugin,
    entity: isCreate ? undefined : effectiveEntity,
    onClose,
  });

  const title = isCreate ? "Create Remote" : `Edit ${entity?.name ?? "Remote"}`;

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
        kind="remote"
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

interface IRemoteModalProps {
  isOpen: boolean;
  entity?: IEntityForEdit;
  onClose: () => void;
}

/** Create/edit modal for remotes; wizard vs plain follows the catalog. */
export const RemoteModal = ({ isOpen, entity, onClose }: IRemoteModalProps) =>
  isOpen ? <RemoteModalInner entity={entity} onClose={onClose} /> : null;

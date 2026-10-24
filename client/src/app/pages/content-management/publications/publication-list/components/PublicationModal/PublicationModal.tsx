import type React from "react";

import { EntityModalBody } from "@app/components/EntityModalBody";
import { EntityModalShell } from "@app/components/EntityModalShell";
import { PluginTypeSelector } from "@app/components/PluginTypeSelector";
import { usePluginTypeSelection } from "@app/hooks/pluginForm/usePluginTypeSelection";

import { usePublicationForm } from "./usePublicationForm";

interface IPublicationModalInnerProps {
  onClose: () => void;
}

const PublicationModalInner: React.FC<IPublicationModalInnerProps> = ({
  onClose,
}) => {
  const {
    availablePlugins,
    selectedType,
    setSelectedType,
    selectedPlugin,
    useWizard,
  } = usePluginTypeSelection({ kind: "publication" });

  const { onSubmit, isSubmitting, submitError } = usePublicationForm({
    plugin: selectedPlugin,
    onClose,
  });

  const typeSelector =
    availablePlugins.length > 1 ? (
      <PluginTypeSelector
        available={availablePlugins}
        selectedType={selectedType}
        onChange={setSelectedType}
      />
    ) : undefined;

  return (
    <EntityModalShell
      title="Create Publication"
      variant={useWizard ? "wizard" : "plain"}
      isDetailLoading={false}
      isCreate
      onClose={onClose}
    >
      <EntityModalBody
        key={selectedType}
        kind="publication"
        plugin={selectedPlugin}
        useWizard={useWizard}
        title="Create Publication"
        typeSelector={typeSelector}
        onClose={onClose}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
        submitError={submitError}
      />
    </EntityModalShell>
  );
};

interface IPublicationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Create modal for publications (create-only — publications are immutable). */
export const PublicationModal: React.FC<IPublicationModalProps> = ({
  isOpen,
  onClose,
}) => (isOpen ? <PublicationModalInner onClose={onClose} /> : null);

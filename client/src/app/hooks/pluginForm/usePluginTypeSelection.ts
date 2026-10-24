import { useState } from "react";

import { useCreatablePlugins } from "@app/hooks/pluginForm/useCreatablePlugins";
import { type IEntityForEdit } from "@app/hooks/pluginForm/useEntityForm";
import { resolvePulpType } from "@app/queries/utils/pulpHref";
import { type EntityType, getPlugin, type IPlugin } from "@catalog";

export interface IPluginTypeSelection {
  /** Plugins implementing this family, installed and UI-creatable (create mode). */
  availablePlugins: IPlugin[];
  selectedType: string;
  setSelectedType: (value: string) => void;
  /** Resolved plugin for the selected (create) or edited pulp_type. */
  selectedPlugin: IPlugin | undefined;
  /** Wizard vs plain modal, from the catalog plugin (`form.isWizard`). */
  useWizard: boolean;
}

interface IUsePluginTypeSelectionOptions {
  /** The content entity type (catalog key). */
  kind: EntityType;
  /** Present ⇒ edit mode (the list row or the full entity — both carry `pulp_href`). */
  entity?: IEntityForEdit;
}

/**
 * Resolves a content-family modal's plugin type (the create-time selector, or the edited
 * entity's type from its href) plus the wizard flag.
 */
export const usePluginTypeSelection = ({
  kind,
  entity,
}: IUsePluginTypeSelectionOptions): IPluginTypeSelection => {
  const isCreate = !entity;

  const availablePlugins = useCreatablePlugins(kind);
  const [selectedType, setSelectedType] = useState(
    availablePlugins[0]?.pulpType ?? "",
  );

  const editType = entity ? (resolvePulpType(entity.pulp_href) ?? "") : "";
  const selectedPlugin = getPlugin(isCreate ? selectedType : editType);

  const useWizard = selectedPlugin?.entities[kind]?.form.isWizard ?? false;

  return {
    availablePlugins,
    selectedType,
    setSelectedType,
    selectedPlugin,
    useWizard,
  };
};

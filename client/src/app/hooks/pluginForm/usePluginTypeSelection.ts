import { useState } from "react";

import { type EntityType, getPlugin, type IPlugin } from "@catalog";
import { resolvePulpType } from "@app/queries/utils/pulpHref";
import { type IEntityForEdit } from "@app/hooks/pluginForm/useEntityForm";
import { useCreatablePlugins } from "@app/hooks/pluginForm/useCreatablePlugins";

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

interface IUsePluginTypeSelectionArgs {
  /** The content entity type (catalog key). */
  kind: EntityType;
  /** Present ⇒ edit mode (the list row or the full entity — both carry `pulp_href`). */
  entity?: IEntityForEdit;
}

/**
 * Resolves the plugin type for a content-family modal: the create-time type selector
 * state (available plugins + selection), or the edited entity's type from its href —
 * plus the wizard flag. The edit-mode full-entity prefetch lives in each family's
 * modal (it uses the family's own typed detail query); this hook is plugin-neutral
 * and query-free.
 */
export const usePluginTypeSelection = ({
  kind,
  entity,
}: IUsePluginTypeSelectionArgs): IPluginTypeSelection => {
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

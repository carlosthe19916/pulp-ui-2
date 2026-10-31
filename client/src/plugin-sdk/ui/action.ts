import type { IEntityField } from "@app/utils/entityField";

import type { IRepositoryAction } from "../definition";

/** What a plugin action asks for, and how it is named in menus. */
export interface IActionUi {
  label: string;
  description?: string;
  /** The modal's fields; `[]` runs the action without asking. */
  fields: IEntityField[];
}

/** A repository action as hosts run it: its endpoint (definition) with its UI. */
export interface IPluginAction extends IRepositoryAction, IActionUi {}

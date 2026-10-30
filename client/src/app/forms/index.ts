export {
  EntityFormPage,
  type ISubmitHelpers,
  type ITypeOption,
  type ITypeSelectProps,
} from "./kit/EntityFormPage";
export type { FormMode, FormValues, IFormDef } from "./kit/types";
export { type IDetailSection, toDetailSections } from "./kit/derive/detail";
export { getEntityForm, type IFormEntry, useCreatableTypes } from "./registry";
export { useCreateTypeSelect } from "./useCreateTypeSelect";

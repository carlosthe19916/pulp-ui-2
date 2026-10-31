/**
 * The plugin UI registry (`@plugins`): what hosts render for a pulp_type. Hosts call these
 * lookups; they never import a plugin's files. Pure facts live in `@catalog`.
 */
export {
  getAcsTypes,
  getArchiveImport,
  getClientSetup,
  getContentGuardTypes,
  getContentPanel,
  getContentSearch,
  getCreateAlternatives,
  getEntityForm,
  getPluginPage,
  getPluginPages,
  getRepositoryActions,
  getRepositoryBrowse,
  getRepositoryTab,
  getUploadFields,
  type IAcsType,
  type IFormEntry,
  type IGuardType,
  type IPluginPage,
} from "./registry";

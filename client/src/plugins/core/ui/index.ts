import { definePluginUi, GENERIC } from "@plugin-sdk/ui";

import { core } from "../definition";
import { openpgpDistributionForm } from "./forms/distribution";
import { openpgpKeyringRepositoryForm } from "./forms/repository";

export const coreUi = definePluginUi({
  definition: core,
  ui: {
    label: "OpenPGP keyring",
    repository: {
      "core.openpgp": {
        form: openpgpKeyringRepositoryForm,
        browse: GENERIC,
        tab: null,
      },
    },
    distribution: {
      "core.openpgp": { form: openpgpDistributionForm, clientSetup: GENERIC },
    },
    content: {
      "core.openpgp_publickey": { panel: GENERIC, search: null, upload: [] },
      "core.openpgp_publicsubkey": { panel: GENERIC, search: null },
      "core.openpgp_signature": { panel: GENERIC, search: null },
      "core.openpgp_userattribute": { panel: GENERIC, search: null },
      "core.openpgp_userid": { panel: GENERIC, search: null },
      "core.publishedmetadata": { panel: GENERIC, search: null },
    },
  },
});

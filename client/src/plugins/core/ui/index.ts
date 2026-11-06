import KeyIcon from "@patternfly/react-icons/dist/esm/icons/key-icon";

import { definePluginUi, GENERIC, lazyViews } from "@plugin-sdk/ui";

import { core } from "../definition";
import { coreContentGuards } from "./contentGuards";
import { coreDistributionForm } from "./forms/distribution";
import { coreRepositoryForm } from "./forms/repository";

const openPgpSignatureContent = lazyViews(
  () => import("./content/OpenPgpSignatureContent"),
);

export const coreUi = definePluginUi({
  definition: core,
  ui: {
    label: "OpenPGP keyring",
    icon: KeyIcon,
    repository: {
      "core.openpgp": {
        form: coreRepositoryForm,
        browse: GENERIC,
        tab: null,
      },
    },
    distribution: {
      "core.openpgp": { form: coreDistributionForm, clientSetup: GENERIC },
    },
    content: {
      "core.openpgp_publickey": { panel: GENERIC, search: null, upload: [] },
      "core.openpgp_publicsubkey": { panel: GENERIC, search: null },
      "core.openpgp_signature": {
        panel: openPgpSignatureContent("OpenPgpSignatureContent"),
        search: null,
      },
      "core.openpgp_userattribute": { panel: GENERIC, search: null },
      "core.openpgp_userid": { panel: GENERIC, search: null },
      "core.publishedmetadata": { panel: GENERIC, search: null },
    },
    contentGuard: coreContentGuards,
  },
});

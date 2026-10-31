import type { IEntityField } from "@app/utils/entityField";
import { contentGuardBaseFields } from "@app/utils/entityFieldPresets";
import { definePluginUi } from "@plugin-sdk/ui";

import { certguard } from "../definition";

const caCertificate: IEntityField = {
  key: "ca_certificate",
  label: "CA certificate",
  type: "textarea",
  required: true,
  helpText:
    "PEM-encoded CA certificate that client certificates must chain to.",
};

export const certguardUi = definePluginUi({
  definition: certguard,
  ui: {
    label: "Certguard",
    contentGuard: {
      "certguard.x509": {
        label: "X.509 certificate",
        description: "Clients presenting a certificate signed by a CA.",
        fields: [...contentGuardBaseFields, caCertificate],
      },
      "certguard.rhsm": {
        label: "RHSM certificate",
        description:
          "Clients presenting an entitlement certificate for the path.",
        fields: [...contentGuardBaseFields, caCertificate],
      },
    },
  },
});

import dayjs from "dayjs";

import type { ContainerManifestSignatureResponse } from "@app/client";
import { formatDateTime } from "@app/utils/utils";

/** An image signature as the shared `Signatures` list shows it; Pulp may record only its key ID. */
export const signatureOf = (signature: ContainerManifestSignatureResponse) => ({
  key: signature.fingerprint ?? `keyid:${signature.key_id}`,
  details: {
    Type: signature.type,
    Creator: signature.creator,
    Signed: formatDateTime(dayjs.unix(signature.timestamp).toISOString()),
  },
});

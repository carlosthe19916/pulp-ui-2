import type React from "react";

import { ClipboardCopy } from "@patternfly/react-core";

import { formatFingerprint } from "../utils/publicKey";

interface IFingerprintCopyProps {
  fingerprint?: string;
}

/** A key fingerprint shown grouped for reading, copied as the bare hex tools expect. */
export const FingerprintCopy: React.FC<IFingerprintCopyProps> = ({
  fingerprint,
}) =>
  fingerprint ? (
    <ClipboardCopy
      variant="inline-compact"
      isCode
      isReadOnly
      hoverTip="Copy fingerprint"
      clickTip="Copied"
      onCopy={() => void navigator.clipboard?.writeText(fingerprint)}
    >
      {formatFingerprint(fingerprint)}
    </ClipboardCopy>
  ) : (
    <>—</>
  );

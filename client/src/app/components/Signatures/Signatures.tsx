import type React from "react";

import {
  Checksum,
  FactDescriptions,
  facts,
} from "@app/components/ContentPanelLayout";
import { FingerprintCopy } from "@app/components/FingerprintCopy";
import { ResourceHrefLink } from "@app/components/ResourceHrefLink";
import { ResourceName } from "@app/components/ResourceName";
import { parseKey } from "@app/utils/openpgpKeys";

import type { IRelatedPaging } from "./related";
import { RelatedSection } from "./RelatedSection";

interface ISignature {
  /** A bare fingerprint or a `v4:`, `v6:` or `keyid:` identifier. */
  key: string;
  /** The signing service that made it, when Pulp records one. */
  signingService?: string | null;
  /** The signature's own content unit, when it is one. */
  href?: string;
  details?: Record<string, React.ReactNode>;
}

interface ISignaturesProps {
  signatures: ISignature[];
  isLoading?: boolean;
  emptyText?: string;
  /** Pages the list when the caller reads it in pages. */
  paging?: IRelatedPaging;
}

/** The signatures Pulp holds and their keys; the UI doesn't verify them. */
export const Signatures: React.FC<ISignaturesProps> = ({
  signatures,
  isLoading,
  emptyText,
  paging,
}) => (
  <RelatedSection
    title="Signatures"
    shown={signatures.length}
    isLoading={isLoading}
    emptyText={emptyText}
    paging={paging}
  >
    {signatures.map(({ key, signingService, href, details }) => {
      const { fingerprint, keyId = key } = parseKey(key);
      return (
        <FactDescriptions
          key={href ?? key}
          aria-label="Signature"
          items={facts({
            "Signed by": signingService && (
              <ResourceName kind="signingService" href={signingService} />
            ),
            "Key ID": keyId && <Checksum value={keyId} />,
            Fingerprint: fingerprint && (
              <FingerprintCopy fingerprint={fingerprint} />
            ),
            ...details,
            Signature: href && (
              <ResourceHrefLink
                kind="content"
                href={href}
                label="View signature"
              />
            ),
          })}
        />
      );
    })}
  </RelatedSection>
);

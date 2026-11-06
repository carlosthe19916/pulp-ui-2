import type React from "react";

import { Label } from "@patternfly/react-core";

import type { OpenPgpSignatureResponse } from "@app/client";
import {
  ContentHeader,
  ContentPanelLayout,
  FactList,
  facts,
  StorageFacts,
} from "@app/components/ContentPanelLayout";
import { SignedContent } from "@app/components/Signatures";
import { useContentDetailQuery } from "@app/queries/content";
import { formatDateTime } from "@app/utils/utils";
import type { IContentPanelProps } from "@plugin-sdk/ui";

/** A signature packet inside an OpenPGP key: who issued it and whether it expired. */
export const OpenPgpSignatureContent: React.FC<IContentPanelProps> = ({
  href,
}) => {
  const { data, isLoading, error } =
    useContentDetailQuery<OpenPgpSignatureResponse>({ href });
  // `key_expired` is typed as a string but holds a boolean.
  const keyExpired = String(data?.key_expired) === "true";

  return (
    <ContentPanelLayout
      isLoading={isLoading}
      error={error}
      header={
        <ContentHeader
          title="OpenPGP signature"
          labels={
            <>
              {data?.expired && <Label color="orange">Expired</Label>}
              {keyExpired && <Label color="orange">Key expired</Label>}
            </>
          }
        />
      }
      aside={
        <StorageFacts
          href={href}
          created={data?.pulp_created}
          labels={data?.pulp_labels}
        />
      }
    >
      <SignedContent title="Signs" href={data?.signed_content} />
      <FactList
        title="Signature"
        items={facts({
          Issuer: data?.issuer,
          "Signer's user ID": data?.signers_user_id,
          Created: formatDateTime(data?.created),
          "Expires after": data?.expiration_time,
          "Key expires after": data?.key_expiration_time,
        })}
      />
    </ContentPanelLayout>
  );
};

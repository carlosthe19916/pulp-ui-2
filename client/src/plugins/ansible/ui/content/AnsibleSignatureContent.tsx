import type React from "react";

import type { AnsibleCollectionVersionSignatureResponse } from "@app/client";
import {
  ContentHeader,
  ContentPanelLayout,
  StorageFacts,
} from "@app/components/ContentPanelLayout";
import { Signatures, SignedContent } from "@app/components/Signatures";
import { useContentDetailQuery } from "@app/queries/content";
import type { IContentPanelProps } from "@plugin-sdk/ui";

/** One collection signature: its key, signing service and the version it signs. */
export const AnsibleSignatureContent: React.FC<IContentPanelProps> = ({
  href,
}) => {
  const { data, isLoading, error } =
    useContentDetailQuery<AnsibleCollectionVersionSignatureResponse>({ href });

  return (
    <ContentPanelLayout
      isLoading={isLoading}
      error={error}
      header={<ContentHeader title="Collection signature" />}
      aside={
        <StorageFacts
          href={href}
          created={data?.pulp_created}
          labels={data?.pulp_labels}
        />
      }
    >
      <SignedContent title="Signs" href={data?.signed_collection} />
      {data && (
        <Signatures
          signatures={[
            {
              key: data.pubkey_fingerprint ?? "",
              signingService: data.signing_service,
            },
          ]}
        />
      )}
    </ContentPanelLayout>
  );
};

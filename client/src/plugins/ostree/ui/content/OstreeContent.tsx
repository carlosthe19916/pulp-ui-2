import type React from "react";

import type { OstreeOstreeContentResponse } from "@app/client";
import {
  basename,
  Checksum,
  ContentHeader,
  ContentPanelLayout,
  dirname,
  FactList,
  facts,
  type IContentPanelProps,
  StorageFacts,
} from "@app/components/ContentPanelLayout";
import { useContentDetailQuery } from "@app/queries/content";

/** An OSTree repository file, identified by its path and object digest. */
export const OstreeContent: React.FC<IContentPanelProps> = ({ href }) => {
  const { data, isLoading, error } =
    useContentDetailQuery<OstreeOstreeContentResponse>({ href });

  return (
    <ContentPanelLayout
      isLoading={isLoading}
      error={error}
      header={
        <ContentHeader
          title={basename(data?.relative_path)}
          subtitle={dirname(data?.relative_path)}
        />
      }
      aside={
        <>
          <FactList
            title="Object"
            items={facts({
              Digest: data?.digest ? <Checksum value={data.digest} /> : null,
            })}
          />
          <StorageFacts
            href={href}
            artifactHref={data?.artifact}
            created={data?.pulp_created}
            labels={data?.pulp_labels}
          />
        </>
      }
    />
  );
};

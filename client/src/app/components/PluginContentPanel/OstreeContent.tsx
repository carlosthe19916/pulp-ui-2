import type React from "react";

import type { OstreeOstreeContentResponse } from "@app/client";
import { useContentDetailQuery } from "@app/queries/content";

import type { IPluginContentProps } from "./contentFields";
import { basename, dirname, facts } from "./contentFields";
import {
  Checksum,
  ContentHeader,
  ContentPanelLayout,
  FactList,
  StorageFacts,
} from "./ContentPanelLayout";

/** An OSTree repository file, identified by its path and object digest. */
export const OstreeContent: React.FC<IPluginContentProps> = ({ href }) => {
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

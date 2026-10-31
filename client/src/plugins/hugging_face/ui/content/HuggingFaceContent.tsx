import type React from "react";

import prettyBytes from "pretty-bytes";

import type { HuggingFaceHuggingFaceContentResponse } from "@app/client";
import { useContentDetailQuery } from "@app/queries/content";
import { formatDateTime } from "@app/utils/utils";
import {
  basename,
  ContentHeader,
  ContentPanelLayout,
  FactList,
  facts,
  InstallSnippet,
  type IPluginContentProps,
  StorageFacts,
} from "@plugin-sdk/ui/blocks/content";

/** Hub "Files and versions": one file of a repo at a revision. */
export const HuggingFaceContent: React.FC<IPluginContentProps> = ({ href }) => {
  const { data, isLoading, error } =
    useContentDetailQuery<HuggingFaceHuggingFaceContentResponse>({ href });

  return (
    <ContentPanelLayout
      isLoading={isLoading}
      error={error}
      header={
        <ContentHeader
          title={basename(data?.relative_path)}
          subtitle={data?.repo_id}
          version={data?.revision}
        />
      }
      aside={
        <>
          <FactList
            title="File"
            items={facts({
              "Repo type": data?.repo_type,
              Path: data?.relative_path,
              Size: data?.size ? prettyBytes(data.size) : null,
              Modified: formatDateTime(data?.last_modified),
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
    >
      <InstallSnippet
        title="Download"
        command={`huggingface-cli download ${data?.repo_id} ${data?.relative_path} --revision ${data?.revision}`}
      />
    </ContentPanelLayout>
  );
};

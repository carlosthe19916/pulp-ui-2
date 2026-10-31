import type React from "react";
import { useState } from "react";

import { Button, Content, ContentVariants } from "@patternfly/react-core";

import type {
  OstreeOstreeCommitResponse,
  OstreeOstreeRefResponse,
} from "@app/client";
import {
  Checksum,
  ContentHeader,
  ContentPanelLayout,
  ContentSection,
  StorageFacts,
} from "@app/components/ContentPanelLayout";
import { useContentDetailQuery } from "@app/queries/content";
import type { IContentPanelProps } from "@plugin-sdk/ui";

const PAGE = 10;

interface ICommitChainProps {
  href: string;
  remaining: number;
  onMore: () => void;
}

/**
 * One commit of `ostree log`, then its parent. Commits only link to their parent,
 * so history is walked one request at a time, `remaining` commits deep.
 */
const CommitChain: React.FC<ICommitChainProps> = ({
  href,
  remaining,
  onMore,
}) => {
  const { data } = useContentDetailQuery<OstreeOstreeCommitResponse>({ href });
  if (!data) return null;
  return (
    <>
      <Checksum value={data.checksum} />
      {data.parent_commit ? (
        remaining > 1 ? (
          <CommitChain
            href={data.parent_commit}
            remaining={remaining - 1}
            onMore={onMore}
          />
        ) : (
          <Button variant="link" isInline onClick={onMore}>
            Load more
          </Button>
        )
      ) : (
        <Content component={ContentVariants.small}>Initial commit</Content>
      )}
    </>
  );
};

/** `ostree refs` / `ostree log`: the branch, its head commit and the history behind it. */
export const OstreeRefContent: React.FC<IContentPanelProps> = ({ href }) => {
  const { data, isLoading, error } =
    useContentDetailQuery<OstreeOstreeRefResponse>({ href });
  const [depth, setDepth] = useState(PAGE);

  return (
    <ContentPanelLayout
      isLoading={isLoading}
      error={error}
      header={<ContentHeader title={data?.name} subtitle="Branch" />}
      aside={
        <StorageFacts
          href={href}
          artifactHref={data?.artifact}
          created={data?.pulp_created}
          labels={data?.pulp_labels}
        />
      }
    >
      <ContentSection title="History">
        {data?.commit ? (
          <CommitChain
            href={data.commit}
            remaining={depth}
            onMore={() => setDepth((current) => current + PAGE)}
          />
        ) : null}
      </ContentSection>
    </ContentPanelLayout>
  );
};

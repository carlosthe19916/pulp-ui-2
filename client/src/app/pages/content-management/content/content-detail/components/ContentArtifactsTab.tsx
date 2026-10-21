import type React from "react";

import prettyBytes from "pretty-bytes";

import {
  Card,
  CardBody,
  CardTitle,
  ClipboardCopy,
  Content,
  ContentVariants,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Stack,
  StackItem,
} from "@patternfly/react-core";

import type { MultipleArtifactContentResponse } from "@app/client";
import { LoadingWrapper } from "@app/components/LoadingWrapper";
import { useArtifactDetailQuery } from "@app/queries/artifacts";
import { useContentDetailQuery } from "@app/queries/content";

/**
 * A content unit carries either a single `artifact` href (most types) or an `artifacts`
 * map (multiple-artifact types). The generator drops the untyped `artifacts` map and
 * single-artifact types also expose a `relative_path`, so widen the sparse base here.
 */
type IArtifactContent = MultipleArtifactContentResponse & {
  artifact?: string | null;
  artifacts?: Record<string, string | null>;
  relative_path?: string;
};

interface IContentArtifactsTabProps {
  href: string;
}

const DetailRow: React.FC<{ term: string; children: React.ReactNode }> = ({
  term,
  children,
}) => (
  <DescriptionListGroup>
    <DescriptionListTerm>{term}</DescriptionListTerm>
    <DescriptionListDescription>{children}</DescriptionListDescription>
  </DescriptionListGroup>
);

/** One artifact: its size/checksum come from the artifact read-model (if downloaded). */
const ArtifactCard: React.FC<{
  relativePath: string;
  artifactHref: string | null;
}> = ({ relativePath, artifactHref }) => {
  const { data: artifact } = useArtifactDetailQuery({
    href: artifactHref ?? "",
  });

  return (
    <Card>
      <CardTitle>{relativePath}</CardTitle>
      <CardBody>
        <DescriptionList isCompact>
          <DetailRow term="Status">
            {artifactHref ? "Downloaded" : "Not downloaded"}
          </DetailRow>
          {typeof artifact?.size === "number" && (
            <DetailRow term="Size">{prettyBytes(artifact.size)}</DetailRow>
          )}
          {artifact?.sha256 && (
            <DetailRow term="SHA-256">
              <ClipboardCopy variant="inline-compact" isReadOnly>
                {artifact.sha256}
              </ClipboardCopy>
            </DetailRow>
          )}
          {artifactHref && (
            <DetailRow term="Artifact">
              <ClipboardCopy variant="inline-compact" isReadOnly>
                {artifactHref}
              </ClipboardCopy>
            </DetailRow>
          )}
        </DescriptionList>
      </CardBody>
    </Card>
  );
};

/**
 * The content unit's artifacts, one card each — handles both the single-artifact and
 * multiple-artifact (and on-demand/not-downloaded) shapes. Generic across content types.
 */
export const ContentArtifactsTab: React.FC<IContentArtifactsTabProps> = ({
  href,
}) => {
  const { data, isLoading, error } = useContentDetailQuery<IArtifactContent>({
    href,
  });

  // Normalize to a relative-path → artifact-href map regardless of the unit's shape.
  const artifacts: Record<string, string | null> =
    data?.artifacts ??
    (data && "artifact" in data
      ? { [data.relative_path ?? "artifact"]: data.artifact ?? null }
      : {});
  const entries = Object.entries(artifacts);

  return (
    <LoadingWrapper isFetching={isLoading} fetchError={error}>
      {entries.length === 0 ? (
        <Content component={ContentVariants.p}>
          No artifacts for this content unit.
        </Content>
      ) : (
        <Stack hasGutter>
          {entries.map(([relativePath, artifactHref]) => (
            <StackItem key={relativePath}>
              <ArtifactCard
                relativePath={relativePath}
                artifactHref={artifactHref}
              />
            </StackItem>
          ))}
        </Stack>
      )}
    </LoadingWrapper>
  );
};

import type React from "react";

import prettyBytes from "pretty-bytes";

import {
  ClipboardCopy,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from "@patternfly/react-core";

import type {
  AnsibleCollectionVersionResponse,
  DebPackageResponse,
  FileFileContentResponse,
  GemGemContentResponse,
  MavenMavenArtifactResponse,
  MultipleArtifactContentResponse,
  NpmPackageResponse,
  OstreeOstreeContentResponse,
  PythonPythonPackageContentResponse,
  RpmPackageResponse,
} from "@app/client";
import { LoadingWrapper } from "@app/components/LoadingWrapper";
import { PulpTypeLabel } from "@app/components/PulpTypeLabel";
import { useArtifactDetailQuery } from "@app/queries/artifacts";
import { useContentDetailQuery } from "@app/queries/content";
import type { DrfAxiosError } from "@app/queries/utils/openapiErrorTypes";
import { resolvePulpType } from "@app/queries/utils/pulpHref";
import { formatDateTime } from "@app/utils/utils";

interface IContentDetailPanelProps {
  href: string;
}

/** Fields the view renders; each typed component below passes only the ones its type has. */
interface IContentDetailViewProps extends IContentDetailPanelProps {
  isLoading: boolean;
  error: DrfAxiosError | null;
  relativePath?: string;
  name?: string;
  version?: string;
  sha256?: string | null;
  artifactHref?: string;
  pulpLabels?: { [key: string]: string | null };
  created?: string;
  prn?: string;
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

/**
 * Presentational detail list. Size (and a checksum fallback) come from the artifact
 * read-model; type-specific rows render only when the typed component supplied them.
 */
const ContentDetailView: React.FC<IContentDetailViewProps> = (props) => {
  const { data: artifact } = useArtifactDetailQuery({
    href: props.artifactHref ?? "",
  });
  const pulpType = resolvePulpType(props.href);
  const sha256 = props.sha256 ?? artifact?.sha256 ?? "";
  const labels = Object.entries(props.pulpLabels ?? {})
    .map(([key, value]) => `${key}=${value ?? ""}`)
    .join(", ");

  return (
    <LoadingWrapper isFetching={props.isLoading} fetchError={props.error}>
      <DescriptionList isHorizontal isCompact>
        <DetailRow term="Type">
          {pulpType ? <PulpTypeLabel pulpType={pulpType} /> : "—"}
        </DetailRow>
        {props.name && <DetailRow term="Name">{props.name}</DetailRow>}
        {props.version && <DetailRow term="Version">{props.version}</DetailRow>}
        {props.relativePath && (
          <DetailRow term="Relative path">{props.relativePath}</DetailRow>
        )}
        {sha256 && (
          <DetailRow term="SHA-256">
            <ClipboardCopy variant="inline-compact" isReadOnly>
              {sha256}
            </ClipboardCopy>
          </DetailRow>
        )}
        {typeof artifact?.size === "number" && (
          <DetailRow term="Size">{prettyBytes(artifact.size)}</DetailRow>
        )}
        <DetailRow term="Labels">{labels || "—"}</DetailRow>
        <DetailRow term="Created">
          {formatDateTime(props.created) ?? "—"}
        </DetailRow>
        <DetailRow term="PRN">{props.prn ?? "—"}</DetailRow>
      </DescriptionList>
    </LoadingWrapper>
  );
};

// One typed component per content type: each fetches its concrete generated type and
// passes only the fields that type declares — so field access is fully type-checked.

const FileDetail: React.FC<IContentDetailPanelProps> = ({ href }) => {
  const { data, isLoading, error } =
    useContentDetailQuery<FileFileContentResponse>({ href });
  return (
    <ContentDetailView
      href={href}
      isLoading={isLoading}
      error={error}
      relativePath={data?.relative_path}
      sha256={data?.sha256}
      artifactHref={data?.artifact}
      pulpLabels={data?.pulp_labels}
      created={data?.pulp_created}
      prn={data?.prn}
    />
  );
};

const RpmDetail: React.FC<IContentDetailPanelProps> = ({ href }) => {
  const { data, isLoading, error } = useContentDetailQuery<RpmPackageResponse>({
    href,
  });
  return (
    <ContentDetailView
      href={href}
      isLoading={isLoading}
      error={error}
      name={data?.name}
      version={data?.version}
      sha256={data?.sha256}
      artifactHref={data?.artifact}
      pulpLabels={data?.pulp_labels}
      created={data?.pulp_created}
      prn={data?.prn}
    />
  );
};

const PythonDetail: React.FC<IContentDetailPanelProps> = ({ href }) => {
  const { data, isLoading, error } =
    useContentDetailQuery<PythonPythonPackageContentResponse>({ href });
  return (
    <ContentDetailView
      href={href}
      isLoading={isLoading}
      error={error}
      name={data?.name}
      version={data?.version}
      sha256={data?.sha256}
      artifactHref={data?.artifact}
      pulpLabels={data?.pulp_labels}
      created={data?.pulp_created}
      prn={data?.prn}
    />
  );
};

const DebDetail: React.FC<IContentDetailPanelProps> = ({ href }) => {
  const { data, isLoading, error } = useContentDetailQuery<DebPackageResponse>({
    href,
  });
  return (
    <ContentDetailView
      href={href}
      isLoading={isLoading}
      error={error}
      relativePath={data?.relative_path}
      version={data?.version}
      sha256={data?.sha256}
      artifactHref={data?.artifact}
      pulpLabels={data?.pulp_labels}
      created={data?.pulp_created}
      prn={data?.prn}
    />
  );
};

const GemDetail: React.FC<IContentDetailPanelProps> = ({ href }) => {
  const { data, isLoading, error } =
    useContentDetailQuery<GemGemContentResponse>({ href });
  return (
    <ContentDetailView
      href={href}
      isLoading={isLoading}
      error={error}
      name={data?.name}
      version={data?.version}
      pulpLabels={data?.pulp_labels}
      created={data?.pulp_created}
      prn={data?.prn}
    />
  );
};

const NpmDetail: React.FC<IContentDetailPanelProps> = ({ href }) => {
  const { data, isLoading, error } = useContentDetailQuery<NpmPackageResponse>({
    href,
  });
  return (
    <ContentDetailView
      href={href}
      isLoading={isLoading}
      error={error}
      name={data?.name}
      version={data?.version}
      relativePath={data?.relative_path}
      artifactHref={data?.artifact}
      pulpLabels={data?.pulp_labels}
      created={data?.pulp_created}
      prn={data?.prn}
    />
  );
};

const MavenDetail: React.FC<IContentDetailPanelProps> = ({ href }) => {
  const { data, isLoading, error } =
    useContentDetailQuery<MavenMavenArtifactResponse>({ href });
  return (
    <ContentDetailView
      href={href}
      isLoading={isLoading}
      error={error}
      version={data?.version}
      artifactHref={data?.artifact}
      pulpLabels={data?.pulp_labels}
      created={data?.pulp_created}
      prn={data?.prn}
    />
  );
};

const OstreeDetail: React.FC<IContentDetailPanelProps> = ({ href }) => {
  const { data, isLoading, error } =
    useContentDetailQuery<OstreeOstreeContentResponse>({ href });
  return (
    <ContentDetailView
      href={href}
      isLoading={isLoading}
      error={error}
      relativePath={data?.relative_path}
      artifactHref={data?.artifact}
      pulpLabels={data?.pulp_labels}
      created={data?.pulp_created}
      prn={data?.prn}
    />
  );
};

const AnsibleCollectionDetail: React.FC<IContentDetailPanelProps> = ({
  href,
}) => {
  const { data, isLoading, error } =
    useContentDetailQuery<AnsibleCollectionVersionResponse>({ href });
  return (
    <ContentDetailView
      href={href}
      isLoading={isLoading}
      error={error}
      name={data?.name}
      version={data?.version}
      sha256={data?.sha256}
      artifactHref={data?.artifact}
      pulpLabels={data?.pulp_labels}
      created={data?.pulp_created}
      prn={data?.prn}
    />
  );
};

/** Fallback for types without a dedicated component: base fields only (sparse). */
const BaseDetail: React.FC<IContentDetailPanelProps> = ({ href }) => {
  const { data, isLoading, error } =
    useContentDetailQuery<MultipleArtifactContentResponse>({ href });
  return (
    <ContentDetailView
      href={href}
      isLoading={isLoading}
      error={error}
      pulpLabels={data?.pulp_labels}
      created={data?.pulp_created}
      prn={data?.prn}
    />
  );
};

const DETAIL_BY_TYPE: Record<string, React.FC<IContentDetailPanelProps>> = {
  "file.file": FileDetail,
  "rpm.package": RpmDetail,
  "python.python": PythonDetail,
  "deb.package": DebDetail,
  "gem.gem": GemDetail,
  "npm.package": NpmDetail,
  "maven.artifact": MavenDetail,
  "ostree.content": OstreeDetail,
  "ansible.collection_version": AnsibleCollectionDetail,
};

/**
 * Expanded-row detail for a content unit. Dispatches on the unit's pulp_type to a
 * component typed with that type's concrete generated response (no union/projection),
 * falling back to the sparse base for types without a dedicated component.
 */
export const ContentDetailPanel: React.FC<IContentDetailPanelProps> = ({
  href,
}) => {
  const Detail = DETAIL_BY_TYPE[resolvePulpType(href) ?? ""] ?? BaseDetail;
  return <Detail href={href} />;
};

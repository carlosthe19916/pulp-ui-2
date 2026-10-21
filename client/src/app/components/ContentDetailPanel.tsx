import type React from "react";

import prettyBytes from "pretty-bytes";

import {
  ClipboardCopy,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Label,
  LabelGroup,
  Stack,
  StackItem,
  Title,
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

/** One term/value pair in the type-specific "Properties" section. */
interface IDetailRow {
  term: string;
  value: React.ReactNode;
}

/**
 * Build a row list from `[term, value]` pairs, dropping empty values so each type
 * only surfaces the fields its unit actually carries.
 */
const rows = (pairs: Array<[string, unknown]>): IDetailRow[] =>
  pairs
    .filter(([, value]) => value != null && value !== "")
    .map(([term, value]) => ({ term, value: value as React.ReactNode }));

/** What the presentational view needs; each typed component maps its response to this. */
interface IContentDetailViewProps extends IContentDetailPanelProps {
  isLoading: boolean;
  error: DrfAxiosError | null;
  /** Type-specific properties, in display order. */
  properties: IDetailRow[];
  /** Primary artifact href — drives the Size/SHA-256 fallback from the artifact. */
  artifactHref?: string | null;
  sha256?: string | null;
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

const PulpLabels: React.FC<{ labels?: { [key: string]: string | null } }> = ({
  labels,
}) => {
  const entries = Object.entries(labels ?? {});
  if (entries.length === 0) {
    return <>—</>;
  }
  return (
    <LabelGroup numLabels={8} isCompact>
      {entries.map(([key, value]) => (
        <Label key={key} isCompact>
          {value == null ? key : `${key}=${value}`}
        </Label>
      ))}
    </LabelGroup>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <StackItem>
    <Title headingLevel="h3" size="md">
      {title}
    </Title>
    {children}
  </StackItem>
);

/**
 * Presentational, shell-agnostic detail. Renders the type-specific properties the
 * dispatching component supplied, then a shared Metadata section. Size (and a SHA-256
 * fallback) come from the artifact read-model. Used both in the content detail page's
 * Details tab and in the repository-version content table's expanded row.
 */
const ContentDetailView: React.FC<IContentDetailViewProps> = (props) => {
  const { data: artifact } = useArtifactDetailQuery({
    href: props.artifactHref ?? "",
  });
  const pulpType = resolvePulpType(props.href);
  const sha256 = props.sha256 ?? artifact?.sha256 ?? "";

  const propertyRows = [
    ...props.properties,
    ...rows([
      ["SHA-256", sha256],
      [
        "Size",
        typeof artifact?.size === "number"
          ? prettyBytes(artifact.size)
          : undefined,
      ],
    ]),
  ];

  return (
    <LoadingWrapper isFetching={props.isLoading} fetchError={props.error}>
      <Stack hasGutter>
        {propertyRows.length > 0 && (
          <Section title="Properties">
            <DescriptionList isCompact>
              {propertyRows.map((row) => (
                <DetailRow key={row.term} term={row.term}>
                  {row.term === "SHA-256" && typeof row.value === "string" ? (
                    <ClipboardCopy variant="inline-compact" isReadOnly>
                      {row.value}
                    </ClipboardCopy>
                  ) : (
                    row.value
                  )}
                </DetailRow>
              ))}
            </DescriptionList>
          </Section>
        )}

        <Section title="Metadata">
          <DescriptionList isCompact>
            <DetailRow term="Type">
              {pulpType ? <PulpTypeLabel pulpType={pulpType} /> : "—"}
            </DetailRow>
            <DetailRow term="Labels">
              <PulpLabels labels={props.pulpLabels} />
            </DetailRow>
            <DetailRow term="Created">
              {formatDateTime(props.created) ?? "—"}
            </DetailRow>
            <DetailRow term="PRN">
              {props.prn ? (
                <ClipboardCopy variant="inline-compact" isReadOnly isCode>
                  {props.prn}
                </ClipboardCopy>
              ) : (
                "—"
              )}
            </DetailRow>
          </DescriptionList>
        </Section>
      </Stack>
    </LoadingWrapper>
  );
};

// One typed component per content type: each fetches its concrete generated type and
// maps the fields that matter for that type into `properties` — so field access is
// fully type-checked and each type shows what's relevant to it.

const FileDetail: React.FC<IContentDetailPanelProps> = ({ href }) => {
  const { data, isLoading, error } =
    useContentDetailQuery<FileFileContentResponse>({ href });
  return (
    <ContentDetailView
      href={href}
      isLoading={isLoading}
      error={error}
      properties={rows([["Relative path", data?.relative_path]])}
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
      properties={rows([
        ["Name", data?.name],
        ["Epoch", data?.epoch],
        ["Version", data?.version],
        ["Release", data?.release],
        ["Architecture", data?.arch],
        ["Summary", data?.summary],
        ["License", data?.rpm_license],
        ["Vendor", data?.rpm_vendor],
        ["Group", data?.rpm_group],
        [
          "Installed size",
          typeof data?.size_installed === "number"
            ? prettyBytes(data.size_installed)
            : undefined,
        ],
      ])}
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
      properties={rows([
        ["Name", data?.name],
        ["Version", data?.version],
        ["Summary", data?.summary],
        ["Author", data?.author],
        ["License", data?.license || data?.license_expression],
        ["Requires Python", data?.requires_python],
        ["Homepage", data?.home_page],
      ])}
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
      properties={rows([
        ["Package", data?.package],
        ["Version", data?.version],
        ["Architecture", data?.architecture],
        ["Section", data?.section],
        ["Maintainer", data?.maintainer],
        ["Relative path", data?.relative_path],
      ])}
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
      properties={rows([
        ["Name", data?.name],
        ["Version", data?.version],
        ["Platform", data?.platform],
      ])}
      sha256={data?.checksum}
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
      properties={rows([
        ["Name", data?.name],
        ["Version", data?.version],
        ["Relative path", data?.relative_path],
      ])}
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
      properties={rows([
        ["Group ID", data?.group_id],
        ["Artifact ID", data?.artifact_id],
        ["Version", data?.version],
        ["Filename", data?.filename],
      ])}
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
      properties={rows([
        ["Relative path", data?.relative_path],
        ["Digest", data?.digest],
      ])}
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
      properties={rows([
        ["Namespace", data?.namespace],
        ["Name", data?.name],
        ["Version", data?.version],
        ["License", data?.license],
        ["Requires Ansible", data?.requires_ansible],
      ])}
      sha256={data?.sha256}
      artifactHref={data?.artifact}
      pulpLabels={data?.pulp_labels}
      created={data?.pulp_created}
      prn={data?.prn}
    />
  );
};

/** Fallback for types without a dedicated component: base metadata only (no properties). */
const BaseDetail: React.FC<IContentDetailPanelProps> = ({ href }) => {
  const { data, isLoading, error } =
    useContentDetailQuery<MultipleArtifactContentResponse>({ href });
  return (
    <ContentDetailView
      href={href}
      isLoading={isLoading}
      error={error}
      properties={[]}
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
 * Type-adaptive detail for a content unit. Dispatches on the unit's pulp_type to a
 * component typed with that type's concrete generated response (no union/projection),
 * falling back to the sparse base for types without a dedicated component. Presentational
 * (no `PageSection`) so it renders both in the detail page and in an expanded table row.
 */
export const ContentDetailPanel: React.FC<IContentDetailPanelProps> = ({
  href,
}) => {
  const Detail = DETAIL_BY_TYPE[resolvePulpType(href) ?? ""] ?? BaseDetail;
  return <Detail href={href} />;
};

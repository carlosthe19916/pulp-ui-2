import type React from "react";

import dayjs from "dayjs";
import prettyBytes from "pretty-bytes";

import { Label } from "@patternfly/react-core";

import type { RpmPackageResponse } from "@app/client";
import { useContentDetailQuery } from "@app/queries/content";

import {
  ContentHeader,
  ContentPanelLayout,
  ContentSection,
  FactList,
  InstallSnippet,
  LabelList,
  LinkList,
  StorageFacts,
} from "./ContentPanelLayout";
import { facts, links } from "./contentFields";
import type { IPluginContentProps } from "./contentFields";

const FLAGS: Record<string, string> = {
  EQ: "=",
  LT: "<",
  LE: "<=",
  GT: ">",
  GE: ">=",
};

const formatEvr = (
  epoch?: string | null,
  version?: string | null,
  release?: string | null,
) =>
  `${epoch && epoch !== "0" ? `${epoch}:` : ""}${version}${release ? `-${release}` : ""}`;

/** Entries are `[name, flags, epoch, version, release, pre]`; `rpmlib(...)` are rpm internals. */
const formatRequires = (value: unknown): string[] =>
  (Array.isArray(value) ? value : [])
    .filter(
      (entry): entry is (string | null)[] =>
        Array.isArray(entry) && typeof entry[0] === "string",
    )
    .filter(([name]) => !name?.startsWith("rpmlib("))
    .map(([name, flags, epoch, version, release]) => {
      if (!flags || !version) {
        return name ?? "";
      }
      return `${name} ${FLAGS[flags] ?? flags} ${formatEvr(epoch, version, release)}`;
    });

const unixDate = (seconds?: number) =>
  seconds ? dayjs.unix(seconds).format("YYYY-MM-DD") : undefined;

const bytes = (value?: number) =>
  typeof value === "number" ? prettyBytes(value) : undefined;

/** Fedora Packages style: NEVRA identity, dnf install and requires. */
export const RpmContent: React.FC<IPluginContentProps> = ({ href }) => {
  const { data, isLoading, error } = useContentDetailQuery<RpmPackageResponse>({
    href,
  });

  return (
    <ContentPanelLayout
      isLoading={isLoading}
      error={error}
      header={
        <ContentHeader
          title={data?.name}
          version={formatEvr(data?.epoch, data?.version, data?.release)}
          summary={data?.summary}
          labels={data?.arch && <Label variant="outline">{data.arch}</Label>}
        />
      }
      aside={
        <>
          <LinkList links={links({ Homepage: data?.url })} />
          <FactList
            title="Package"
            items={facts({
              License: data?.rpm_license,
              Vendor: data?.rpm_vendor,
              "Source RPM": data?.rpm_sourcerpm,
              Built: unixDate(data?.time_build),
              "Installed size": bytes(data?.size_installed),
            })}
          />
          <StorageFacts
            artifactHref={data?.artifact}
            sha256={data?.sha256}
            created={data?.pulp_created}
            labels={data?.pulp_labels}
          />
        </>
      }
    >
      <InstallSnippet
        command={`dnf install ${data?.name}-${data?.version}-${data?.release}.${data?.arch}`}
      />
      <ContentSection title="Requires">
        <LabelList
          items={formatRequires(data?.requires)}
          emptyText="No requirements"
        />
      </ContentSection>
    </ContentPanelLayout>
  );
};

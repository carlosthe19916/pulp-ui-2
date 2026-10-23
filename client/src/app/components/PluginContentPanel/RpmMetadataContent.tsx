import type React from "react";

import { Content, ContentVariants } from "@patternfly/react-core";

import type {
  RpmModulemdResponse,
  RpmPackageGroupResponse,
  RpmUpdateRecordResponse,
} from "@app/client";
import { type INevraParams, nevra } from "@app/components/PluginBrowse/helpers";
import { useContentDetailQuery } from "@app/queries/content";
import { formatDateTime } from "@app/utils/utils";

import {
  ContentHeader,
  ContentPanelLayout,
  ContentSection,
  FactList,
  LabelList,
  LinkList,
  StorageFacts,
} from "./ContentPanelLayout";
import { asArray, facts, links } from "./contentFields";
import type { IPluginContentProps } from "./contentFields";

interface IAdvisoryReference {
  id?: string;
  title?: string;
  href?: string;
}

/** Satellite erratum page: type, severity, description, references, affected packages. */
export const RpmAdvisoryContent: React.FC<IPluginContentProps> = ({ href }) => {
  const { data, isLoading, error } =
    useContentDetailQuery<RpmUpdateRecordResponse>({ href });
  const packages = (data?.pkglist ?? []).flatMap((collection) =>
    asArray<INevraParams>(collection.packages),
  );
  const references = asArray<IAdvisoryReference>(data?.references);

  return (
    <ContentPanelLayout
      isLoading={isLoading}
      error={error}
      header={
        <ContentHeader
          title={data?.id}
          subtitle={data?.type}
          summary={data?.title}
        />
      }
      aside={
        <>
          <FactList
            title="Advisory"
            items={facts({
              Severity: data?.severity,
              Status: data?.status,
              Issued: formatDateTime(data?.issued_date),
              Updated: formatDateTime(data?.updated_date),
              "Reboot suggested": data?.reboot_suggested ? "Yes" : null,
              From: data?.fromstr,
            })}
          />
          <LinkList
            links={links(
              Object.fromEntries(
                references.map((ref) => [
                  ref.title || ref.id || ref.href,
                  ref.href,
                ]),
              ),
            )}
          />
          <StorageFacts
            href={href}
            created={data?.pulp_created}
            labels={data?.pulp_labels}
          />
        </>
      }
    >
      {data?.description ? (
        <ContentSection title="Description">
          <Content component={ContentVariants.p}>{data.description}</Content>
        </ContentSection>
      ) : null}
      <ContentSection title={`Packages (${packages.length})`}>
        <LabelList items={packages.map(nevra)} emptyText="No packages" />
      </ContentSection>
    </ContentPanelLayout>
  );
};

/** `dnf module info`: stream, profiles (default marked by the repository), packages. */
export const RpmModulemdContent: React.FC<IPluginContentProps> = ({ href }) => {
  const { data, isLoading, error } = useContentDetailQuery<RpmModulemdResponse>(
    { href },
  );
  const profiles = Object.entries(
    (data?.profiles ?? {}) as Record<string, unknown>,
  ).map(([name, items]) => ({ name, items: asArray<string>(items) }));

  return (
    <ContentPanelLayout
      isLoading={isLoading}
      error={error}
      header={
        <ContentHeader
          title={data ? `${data.name}:${data.stream}` : undefined}
          version={data?.version}
          summary={data?.description}
        />
      }
      aside={
        <>
          <FactList
            title="Module"
            items={facts({ Context: data?.context, Arch: data?.arch })}
          />
          <StorageFacts
            href={href}
            created={data?.pulp_created}
            labels={data?.pulp_labels}
          />
        </>
      }
    >
      <FactList
        title="Profiles"
        items={profiles.map(({ name, items }) => ({
          term: name,
          value: items.join(", ") || "—",
        }))}
      />
      <ContentSection title={`Packages (${data?.packages?.length ?? 0})`}>
        <LabelList
          items={(data?.packages ?? []).filter((p): p is string => !!p)}
          emptyText="No packages"
        />
      </ContentSection>
    </ContentPanelLayout>
  );
};

/** `dnf group info`: the group and the packages it pulls in. */
export const RpmPackageGroupContent: React.FC<IPluginContentProps> = ({
  href,
}) => {
  const { data, isLoading, error } =
    useContentDetailQuery<RpmPackageGroupResponse>({ href });
  const packages = asArray<{ name?: string } | string>(data?.packages).map(
    (pkg) => (typeof pkg === "string" ? pkg : (pkg.name ?? "")),
  );

  return (
    <ContentPanelLayout
      isLoading={isLoading}
      error={error}
      header={
        <ContentHeader
          title={data?.name}
          subtitle={data?.id}
          summary={data?.description}
        />
      }
      aside={
        <>
          <FactList
            title="Group"
            items={facts({
              Default: data?.default ? "Yes" : "No",
              Visible: data?.user_visible ? "Yes" : "No",
            })}
          />
          <StorageFacts
            href={href}
            created={data?.pulp_created}
            labels={data?.pulp_labels}
          />
        </>
      }
    >
      <ContentSection title={`Packages (${packages.length})`}>
        <LabelList items={packages.filter(Boolean)} emptyText="No packages" />
      </ContentSection>
    </ContentPanelLayout>
  );
};

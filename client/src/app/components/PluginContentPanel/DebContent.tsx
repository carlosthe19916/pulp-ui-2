import type React from "react";

import prettyBytes from "pretty-bytes";

import { Label } from "@patternfly/react-core";

import type { DebPackageResponse } from "@app/client";
import { useContentDetailQuery } from "@app/queries/content";

import type { IPluginContentProps } from "./contentFields";
import { facts, links } from "./contentFields";
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

const splitList = (value?: string) =>
  value
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean) ?? [];

/** `Installed-Size` is an integer number of KiB. */
const installedSize = (value?: string) => {
  const kib = Number(value);
  return value && Number.isFinite(kib) ? prettyBytes(kib * 1024) : undefined;
};

/** packages.debian.org style: apt install, depends; package facts in the sidebar. */
export const DebContent: React.FC<IPluginContentProps> = ({ href }) => {
  const { data, isLoading, error } = useContentDetailQuery<DebPackageResponse>({
    href,
  });

  return (
    <ContentPanelLayout
      isLoading={isLoading}
      error={error}
      header={
        <ContentHeader
          title={data?.package}
          version={data?.version}
          labels={
            data?.architecture && (
              <Label variant="outline">{data.architecture}</Label>
            )
          }
        />
      }
      aside={
        <>
          <LinkList links={links({ Homepage: data?.homepage })} />
          <FactList
            title="Package"
            items={facts({
              Section: data?.section,
              Priority: data?.priority,
              Maintainer: data?.maintainer?.replace(/\s*<[^>]*>$/, ""),
              Source: data?.source,
              "Installed size": installedSize(data?.installed_size),
            })}
          />
          <StorageFacts
            href={href}
            artifactHref={data?.artifact}
            sha256={data?.sha256}
            created={data?.pulp_created}
            labels={data?.pulp_labels}
          />
        </>
      }
    >
      <InstallSnippet
        command={`apt install ${data?.package}=${data?.version}`}
      />
      <ContentSection title="Depends">
        <LabelList
          items={splitList(data?.depends)}
          emptyText="No dependencies"
        />
      </ContentSection>
    </ContentPanelLayout>
  );
};

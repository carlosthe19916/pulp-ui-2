import type React from "react";

import prettyBytes from "pretty-bytes";

import {
  Button,
  ClipboardCopy,
  Content,
  ContentVariants,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Divider,
  Flex,
  FlexItem,
  Grid,
  GridItem,
  Label,
  LabelGroup,
  Stack,
  StackItem,
  Title,
} from "@patternfly/react-core";
import ExternalLinkAltIcon from "@patternfly/react-icons/dist/esm/icons/external-link-alt-icon";

import { EditablePulpLabels } from "@app/components/EditablePulpLabels";
import { LoadingWrapper } from "@app/components/LoadingWrapper";
import { Snippet } from "@app/components/Snippet";
import { useArtifactDetailQuery } from "@app/queries/artifacts";
import { contentKeys } from "@app/queries/content";
import type { DrfAxiosError } from "@app/queries/utils/openapiErrorTypes";
import { formatDateTime } from "@app/utils/utils";

import { facts } from "./contentFields";
import type { IFact, ILink } from "./contentFields";

/** Identity header on top, usage sections left, facts sidebar right. */
export const ContentPanelLayout: React.FC<{
  isLoading: boolean;
  error: DrfAxiosError | null;
  header: React.ReactNode;
  aside: React.ReactNode;
  children?: React.ReactNode;
}> = ({ isLoading, error, header, aside, children }) => (
  <LoadingWrapper isFetching={isLoading} fetchError={error}>
    <Stack hasGutter>
      <StackItem>{header}</StackItem>
      <StackItem>
        <Divider />
      </StackItem>
      <StackItem>
        <Grid hasGutter>
          {children ? (
            <GridItem lg={8}>
              <Column>{children}</Column>
            </GridItem>
          ) : null}
          <GridItem lg={children ? 4 : 12}>
            <Column>{aside}</Column>
          </GridItem>
        </Grid>
      </StackItem>
    </Stack>
  </LoadingWrapper>
);

const Column: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Flex
    direction={{ default: "column" }}
    spaceItems={{ default: "spaceItemsXl" }}
  >
    {children}
  </Flex>
);

export const ContentHeader: React.FC<{
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  version?: string;
  labels?: React.ReactNode;
  summary?: string;
}> = ({ title, subtitle, version, labels, summary }) => (
  <Stack hasGutter>
    <Flex
      spaceItems={{ default: "spaceItemsSm" }}
      alignItems={{ default: "alignItemsCenter" }}
    >
      <FlexItem>
        <Title headingLevel="h2" size="2xl">
          {title}
        </Title>
      </FlexItem>
      {version ? (
        <FlexItem>
          <Label color="blue">{version}</Label>
        </FlexItem>
      ) : null}
      {labels ? <FlexItem>{labels}</FlexItem> : null}
    </Flex>
    {subtitle ? (
      <Content component={ContentVariants.small}>{subtitle}</Content>
    ) : null}
    {summary ? (
      <Content component={ContentVariants.p}>{summary}</Content>
    ) : null}
  </Stack>
);

export const ContentSection: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <Flex
    direction={{ default: "column" }}
    spaceItems={{ default: "spaceItemsSm" }}
  >
    <Title headingLevel="h3" size="md">
      {title}
    </Title>
    {children}
  </Flex>
);

export const InstallSnippet: React.FC<{
  title?: string;
  command: string;
}> = ({ title = "Install", command }) => (
  <ContentSection title={title}>
    <Snippet code={command} />
  </ContentSection>
);

export const LabelList: React.FC<{
  items: string[];
  emptyText: string;
}> = ({ items, emptyText }) =>
  items.length === 0 ? (
    <Content component={ContentVariants.small}>{emptyText}</Content>
  ) : (
    <LabelGroup numLabels={12} isCompact>
      {items.map((item) => (
        <Label key={item} variant="outline" isCompact>
          {item}
        </Label>
      ))}
    </LabelGroup>
  );

export const FactList: React.FC<{ title: string; items: IFact[] }> = ({
  title,
  items,
}) =>
  items.length > 0 && (
    <ContentSection title={title}>
      <DescriptionList isCompact>
        {items.map(({ term, value }) => (
          <DescriptionListGroup key={term}>
            <DescriptionListTerm>{term}</DescriptionListTerm>
            <DescriptionListDescription>{value}</DescriptionListDescription>
          </DescriptionListGroup>
        ))}
      </DescriptionList>
    </ContentSection>
  );

export const LinkList: React.FC<{ links: ILink[] }> = ({ links }) =>
  links.length > 0 && (
    <ContentSection title="Links">
      <Flex
        direction={{ default: "column" }}
        spaceItems={{ default: "spaceItemsSm" }}
      >
        {links.map(({ label, url }) => (
          <FlexItem key={label}>
            <Button
              variant="link"
              isInline
              component="a"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              icon={<ExternalLinkAltIcon />}
              iconPosition="end"
            >
              {label}
            </Button>
          </FlexItem>
        ))}
      </Flex>
    </ContentSection>
  );

export const Checksum: React.FC<{ value: string }> = ({ value }) => (
  <ClipboardCopy
    variant="inline-compact"
    isReadOnly
    isCode
    truncation
    hoverTip="Copy"
    clickTip="Copied"
  >
    {value}
  </ClipboardCopy>
);

export const StorageFacts: React.FC<{
  /** The content unit; its labels are editable. */
  href: string;
  artifactHref?: string | null;
  sha256?: string | null;
  size?: number;
  created?: string;
  labels?: { [key: string]: string | null };
}> = ({ href, artifactHref, sha256, size, created, labels }) => {
  const { data: artifact } = useArtifactDetailQuery({
    href: artifactHref ?? "",
  });
  const bytes = size ?? artifact?.size;
  const checksum = sha256 || artifact?.sha256;

  return (
    <FactList
      title="Storage"
      items={facts({
        Size: typeof bytes === "number" ? prettyBytes(bytes) : null,
        "SHA-256": checksum ? <Checksum value={checksum} /> : null,
        Added: formatDateTime(created),
        Labels: (
          <EditablePulpLabels
            href={href}
            labels={labels}
            invalidateKey={contentKeys.detail(href)}
          />
        ),
      })}
    />
  );
};

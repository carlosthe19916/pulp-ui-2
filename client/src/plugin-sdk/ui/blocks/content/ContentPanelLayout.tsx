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
import { useNotifications } from "@app/hooks/useNotifications";
import { useArtifactDetailQuery } from "@app/queries/artifacts";
import { useContentLabelsMutation } from "@app/queries/content";
import type { DrfAxiosError } from "@app/queries/utils/openapiErrorTypes";
import { notifyLabelsResult } from "@app/utils/batchNotify";
import { formatDateTime } from "@app/utils/utils";

import type { IFact, ILink } from "./contentFields";
import { facts } from "./contentFields";

interface IContentPanelLayoutProps {
  isLoading: boolean;
  error: DrfAxiosError | null;
  header: React.ReactNode;
  aside: React.ReactNode;
  children?: React.ReactNode;
}

/** Identity header on top, usage sections left, facts sidebar right. */
export const ContentPanelLayout: React.FC<IContentPanelLayoutProps> = ({
  isLoading,
  error,
  header,
  aside,
  children,
}) => (
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

interface IColumnProps {
  children: React.ReactNode;
}

const Column: React.FC<IColumnProps> = ({ children }) => (
  <Flex
    direction={{ default: "column" }}
    spaceItems={{ default: "spaceItemsXl" }}
  >
    {children}
  </Flex>
);

interface IContentHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  version?: string;
  labels?: React.ReactNode;
  summary?: string;
}

export const ContentHeader: React.FC<IContentHeaderProps> = ({
  title,
  subtitle,
  version,
  labels,
  summary,
}) => (
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

interface IContentSectionProps {
  title: string;
  children: React.ReactNode;
}

export const ContentSection: React.FC<IContentSectionProps> = ({
  title,
  children,
}) => (
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

interface IInstallSnippetProps {
  title?: string;
  command: string;
}

export const InstallSnippet: React.FC<IInstallSnippetProps> = ({
  title = "Install",
  command,
}) => (
  <ContentSection title={title}>
    <Snippet code={command} />
  </ContentSection>
);

interface ILabelListProps {
  items: string[];
  emptyText: string;
}

export const LabelList: React.FC<ILabelListProps> = ({ items, emptyText }) =>
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

interface IFactListProps {
  title: string;
  items: IFact[];
}

export const FactList: React.FC<IFactListProps> = ({ title, items }) =>
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

interface ILinkListProps {
  links: ILink[];
}

export const LinkList: React.FC<ILinkListProps> = ({ links }) =>
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

interface IChecksumProps {
  value: string;
}

export const Checksum: React.FC<IChecksumProps> = ({ value }) => (
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

interface IStorageFactsProps {
  /** The content unit; its labels are editable. */
  href: string;
  artifactHref?: string | null;
  sha256?: string | null;
  size?: number;
  created?: string;
  labels?: { [key: string]: string | null };
}

export const StorageFacts: React.FC<IStorageFactsProps> = ({
  href,
  artifactHref,
  sha256,
  size,
  created,
  labels,
}) => {
  const { data: artifact } = useArtifactDetailQuery({
    href: artifactHref ?? "",
  });
  const bytes = size ?? artifact?.size;
  const checksum = sha256 || artifact?.sha256;
  const { addNotification } = useNotifications();
  const { mutateAsync, isPending } = useContentLabelsMutation({
    onSuccess: (result) => notifyLabelsResult({ addNotification, result }),
  });

  return (
    <FactList
      title="Storage"
      items={facts({
        Size: typeof bytes === "number" ? prettyBytes(bytes) : null,
        "SHA-256": checksum ? <Checksum value={checksum} /> : null,
        Added: formatDateTime(created),
        Labels: (
          <EditablePulpLabels
            labels={labels}
            isSaving={isPending}
            onSave={(changes) => mutateAsync({ href, ...changes })}
          />
        ),
      })}
    />
  );
};

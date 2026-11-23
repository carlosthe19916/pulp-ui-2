import type React from "react";

import { useQuery } from "@tanstack/react-query";

import {
  Alert,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  CodeBlock,
  CodeBlockCode,
  Content,
  DataList,
  DataListCell,
  DataListItem,
  DataListItemCells,
  DataListItemRow,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  ExpandableSection,
  Flex,
  Skeleton,
} from "@patternfly/react-core";
import textStyles from "@patternfly/react-styles/css/utilities/Text/text";

import { PulpTypeLabel } from "@app/components/PulpTypeLabel";
import {
  type ResourceHrefKind,
  ResourceHrefLink,
} from "@app/components/ResourceHrefLink";
import { resolvePulpType } from "@app/queries/utils/pulpHref";
import { isForbiddenError } from "@app/utils/isHttpError";

import { type ApiParams, isPage, pulpGetQueryOptions } from "./pulpGetRequest";

/** The fields that name a row, in the order Pulp's types use them. */
const LABEL_FIELDS = [
  "name",
  "base_path",
  "relative_path",
  "filename",
  "username",
  "role",
  "number",
] as const;
const DETAIL_FIELDS = 3;
const OBJECT_FIELDS = 14;
const RAW_LENGTH = 5_000;

const KIND_BY_SEGMENT: Record<string, ResourceHrefKind> = {
  repositories: "repository",
  remotes: "remote",
  distributions: "distribution",
  publications: "publication",
  content: "content",
};

const kindOf = (href: string): ResourceHrefKind | undefined => {
  if (/\/repositories\/.+\/versions\/\d+\/$/.test(href))
    return "repositoryVersion";
  const segment = href.match(/\/api\/v3\/([^/]+)\//)?.[1];
  return segment ? KIND_BY_SEGMENT[segment] : undefined;
};

const isScalar = (value: unknown): value is string | number | boolean =>
  ["string", "number", "boolean"].includes(typeof value);

const labelOf = (row: Record<string, unknown>): string | undefined => {
  const field = LABEL_FIELDS.find((key) => isScalar(row[key]));
  return field ? String(row[field]) : undefined;
};

interface IRowProps {
  row: Record<string, unknown>;
}

const Row: React.FC<IRowProps> = ({ row }) => {
  const href = typeof row.pulp_href === "string" ? row.pulp_href : undefined;
  const label = labelOf(row);
  const kind = href ? kindOf(href) : undefined;
  const pulpType = href ? resolvePulpType(href) : undefined;
  const details = Object.entries(row)
    .filter(
      ([key, value]) =>
        isScalar(value) &&
        !LABEL_FIELDS.includes(key as (typeof LABEL_FIELDS)[number]) &&
        !key.startsWith("pulp_") &&
        key !== "prn",
    )
    .slice(0, DETAIL_FIELDS);
  return (
    <DataListItem>
      <DataListItemRow>
        <DataListItemCells
          dataListCells={[
            <DataListCell key="row">
              <Flex
                direction={{ default: "column" }}
                spaceItems={{ default: "spaceItemsXs" }}
              >
                <Flex spaceItems={{ default: "spaceItemsSm" }}>
                  {href && kind ? (
                    <ResourceHrefLink kind={kind} href={href} label={label} />
                  ) : (
                    <span>{label ?? href ?? "—"}</span>
                  )}
                  {pulpType &&
                  kind &&
                  kind !== "repositoryVersion" &&
                  kind !== "content" ? (
                    <PulpTypeLabel pulpType={pulpType} entity={kind} />
                  ) : null}
                </Flex>
                {details.length > 0 ? (
                  <Content
                    component="small"
                    className={textStyles.textBreakWord}
                  >
                    {details
                      .map(([key, value]) => `${key}: ${String(value)}`)
                      .join(" · ")}
                  </Content>
                ) : null}
              </Flex>
            </DataListCell>,
          ]}
        />
      </DataListItemRow>
    </DataListItem>
  );
};

interface IApiResultProps {
  url: string;
  params: ApiParams;
  /** The path the model asked for, as the card's title. */
  path: string;
}

/** What one read of the Pulp API returned: rows with links, an object's fields, and the raw JSON. */
export const ApiResult: React.FC<IApiResultProps> = ({ url, params, path }) => {
  const { data, isLoading, error } = useQuery(
    pulpGetQueryOptions({ url, params }),
  );

  if (isLoading) {
    return <Skeleton screenreaderText="Reading Pulp" />;
  }
  if (error) {
    return (
      <Alert
        variant="danger"
        isInline
        isPlain
        title={
          isForbiddenError(error)
            ? `You don't have permission to read ${path}`
            : `Pulp couldn't answer ${path}`
        }
      />
    );
  }

  const filters = Object.entries(params)
    .filter(([key]) => key !== "limit")
    .map(([key, value]) => `${key}=${String(value)}`)
    .join(" ");

  return (
    <Card isCompact>
      <CardHeader>
        <CardTitle component="h3">
          {isPage(data) ? `${data.count} results` : "Result"}
        </CardTitle>
        <Content component="small" className={textStyles.textBreakWord}>
          GET {path}
          {filters ? ` ${filters}` : ""}
        </Content>
      </CardHeader>
      <CardBody>
        {isPage(data) ? (
          data.results.length > 0 ? (
            <>
              <DataList aria-label={`Results of ${path}`} isCompact>
                {data.results.map((row, index) => (
                  <Row key={String(row.pulp_href ?? index)} row={row} />
                ))}
              </DataList>
              {data.count > data.results.length ? (
                <Content component="small">
                  Showing {data.results.length} of {data.count}.
                </Content>
              ) : null}
            </>
          ) : null
        ) : typeof data === "object" && data !== null ? (
          <DescriptionList isCompact isHorizontal>
            {Object.entries(data)
              .filter(([, value]) => isScalar(value))
              .slice(0, OBJECT_FIELDS)
              .map(([key, value]) => (
                <DescriptionListGroup key={key}>
                  <DescriptionListTerm>{key}</DescriptionListTerm>
                  <DescriptionListDescription
                    className={textStyles.textBreakWord}
                  >
                    {String(value)}
                  </DescriptionListDescription>
                </DescriptionListGroup>
              ))}
          </DescriptionList>
        ) : null}
        <ExpandableSection toggleText="Response">
          <CodeBlock>
            <CodeBlockCode>
              {JSON.stringify(data, null, 2).slice(0, RAW_LENGTH)}
            </CodeBlockCode>
          </CodeBlock>
        </ExpandableSection>
      </CardBody>
    </Card>
  );
};

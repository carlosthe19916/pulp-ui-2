import type { ContentTypeApiPaths } from "@catalog";

import type { ContentEndpoints } from "@app/client/pulpTypes.gen";

import type { MultiOrderListParams } from "./utils/listParams";

type EndpointOf<K extends keyof ContentTypeApiPaths> =
  ContentEndpoints[ContentTypeApiPaths[K]];

/**
 * Generated list types (row, page, `*ListData`) of each content type's own endpoint, keyed
 * by pulp_type; derived from the plugin definitions' content apiPaths.
 */
export type IContentTypeMap = {
  [K in keyof ContentTypeApiPaths]: {
    row: NonNullable<EndpointOf<K>["page"]["results"]>[number];
    page: EndpointOf<K>["page"];
    data: EndpointOf<K>["list"];
  };
};

export type ContentTypeKey = keyof IContentTypeMap;

export type ContentTypeRow<K extends ContentTypeKey> =
  IContentTypeMap[K]["row"];

export type ContentTypePage<K extends ContentTypeKey> =
  IContentTypeMap[K]["page"];

/** A page of one content type's list: the spec's filters, multi-field `ordering`, required `limit`. */
export type IContentTypeListParams<K extends ContentTypeKey> =
  MultiOrderListParams<IContentTypeMap[K]["data"]>;

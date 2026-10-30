import { axiosInstance } from "@app/axios-config/apiInit";
import type { SetLabel, UnsetLabel } from "@app/client";
import type { ILabelChanges } from "@app/utils/pulpLabels";

import { toProxyHref } from "./utils/pulpApi";
import { type IBatchResult, settleBatch } from "./utils/settleBatch";

export interface ILabelsChangeVariables extends ILabelChanges {
  /** The labelled resource. */
  href: string;
}

type LabelOp =
  { kind: "set"; label: SetLabel } | { kind: "unset"; key: string };

/**
 * Applies a diff of label changes to one resource in parallel — one synchronous
 * `set_label/` / `unset_label/` call per change — reporting partial failures via `IBatchResult`.
 * Pulp has no replace-all label write, so a "save" is this diff of individual calls. Shared by
 * the per-entity `use<Entity>LabelsMutation` hooks, which each own their own cache invalidation.
 */
export const applyLabelChanges = ({
  href,
  toSet,
  toUnset,
}: ILabelsChangeVariables): Promise<IBatchResult> => {
  const ops: LabelOp[] = [
    ...toSet.map((label): LabelOp => ({ kind: "set", label })),
    ...toUnset.map((key): LabelOp => ({ kind: "unset", key })),
  ];
  return settleBatch({
    items: ops,
    label: (op) => (op.kind === "set" ? op.label.key : op.key),
    request: (op) =>
      op.kind === "set"
        ? axiosInstance.post(
            `${toProxyHref(href)}set_label/`,
            op.label satisfies SetLabel,
          )
        : axiosInstance.post(`${toProxyHref(href)}unset_label/`, {
            key: op.key,
          } satisfies UnsetLabel),
  });
};

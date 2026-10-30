import { useState } from "react";

import { diffLabels, type IKeyValue } from "@app/utils/pulpLabels";

/**
 * Holds the editable draft of a label set: add (key-unique, so re-adding a key replaces it)
 * and remove, plus the diff against the originals. Pure state — no persistence or toasts; the
 * caller decides what to do with `diff`.
 */
export const useLabelsDraft = (original: Record<string, string | null>) => {
  const [draft, setDraft] = useState<Record<string, string | null>>(original);

  const add = ({ key, value }: IKeyValue) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const remove = (key: string) =>
    setDraft((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

  const diff = diffLabels(original, draft);
  const isDirty = diff.toSet.length > 0 || diff.toUnset.length > 0;

  return { draft, add, remove, diff, isDirty };
};

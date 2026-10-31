import type { IContentType } from "@catalog";

import { getUploadFields } from "@plugins";

import type { IUploadItem } from "./useUploadQueue";

/** A content type's upload fields entered per file, as text inputs. */
export const perFileFields = (contentType?: IContentType) =>
  (contentType?.uploadable ? getUploadFields(contentType.pulpType) : []).filter(
    (field) => field.type === "text",
  );

/** Required fields filled in, and relative paths unique within the batch. */
export const fieldErrors = ({
  items,
  contentType,
}: {
  items: IUploadItem[];
  contentType?: IContentType;
}): Map<string, string> => {
  const errors = new Map<string, string>();
  const paths = items.map((item) => item.fields.relative_path ?? "");
  for (const item of items) {
    for (const field of perFileFields(contentType)) {
      if (field.required && !item.fields[field.key]?.trim()) {
        errors.set(item.id, `${field.label} is required`);
      }
    }
    const path = item.fields.relative_path;
    if (path && paths.filter((other) => other === path).length > 1) {
      errors.set(item.id, "Another file has the same relative path");
    }
  }
  return errors;
};

export const formatSize = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

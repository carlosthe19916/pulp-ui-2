import { useRef, useState } from "react";

import type { ContentUploadMechanism } from "@catalog";

import { useContentUploadMutation } from "@app/queries/content";
import { useChunkedUploadMutation } from "@app/queries/uploads";
import { CHUNK_SIZE } from "@app/queries/utils/chunks";
import { getMutationErrorMessage } from "@app/utils/utils";

/** One file in the batch: its upload fields and how its upload is going. */
export interface IUploadItem {
  id: string;
  file: File;
  fields: Record<string, string>;
  /** `processing`: the bytes are sent and a server task is creating the content. */
  status: "waiting" | "uploading" | "processing" | "done" | "failed";
  /** 0–100 while uploading. */
  progress: number;
  contentHref?: string;
  error?: string;
}

/**
 * A batch of files uploaded one after another as one content type (large files in
 * chunks). Uploads create content without a repository;
 * the caller adds the resulting hrefs in one change. `stop` lets the current file
 * finish and skips the rest.
 */
export const useUploadQueue = ({
  apiPath,
  mechanism,
  defaultFields,
}: {
  apiPath: string;
  mechanism: ContentUploadMechanism;
  /** Initial upload fields for a newly picked file. */
  defaultFields: (file: File) => Record<string, string>;
}) => {
  const [items, setItems] = useState<IUploadItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const stopRef = useRef(false);
  const uploadMutation = useContentUploadMutation();
  const chunkedMutation = useChunkedUploadMutation();

  const update = ({ id, patch }: { id: string; patch: Partial<IUploadItem> }) =>
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );

  const uploadOne = async (item: IUploadItem): Promise<IUploadItem> => {
    update({
      id: item.id,
      patch: { status: "uploading", progress: 0, error: undefined },
    });
    const onProgress = (fraction: number) =>
      update({
        id: item.id,
        patch:
          fraction >= 1 && mechanism === "create"
            ? { progress: 100, status: "processing" }
            : { progress: Math.round(fraction * 100) },
      });
    try {
      const upload =
        item.file.size > CHUNK_SIZE
          ? await chunkedMutation.mutateAsync({ file: item.file, onProgress })
          : undefined;
      const contentHref = await uploadMutation.mutateAsync({
        apiPath,
        mechanism,
        fields: item.fields,
        file: upload ? undefined : item.file,
        upload,
        onProgress: upload ? undefined : onProgress,
      });
      const patch = {
        status: "done" as const,
        progress: 100,
        contentHref: contentHref || undefined,
      };
      update({ id: item.id, patch });
      return { ...item, ...patch };
    } catch (error) {
      const message = getMutationErrorMessage({
        error,
        fallback: "Could not upload the file",
      });
      const patch = {
        status: "failed" as const,
        error: message.description ?? message.title,
      };
      update({ id: item.id, patch });
      return { ...item, ...patch };
    }
  };

  /** Uploads every waiting file (or only `ids`), in order; resolves with the batch. */
  const run = async (ids?: string[]): Promise<IUploadItem[]> => {
    stopRef.current = false;
    setIsRunning(true);
    const result: IUploadItem[] = [];
    for (const item of items) {
      const isQueued = ids ? ids.includes(item.id) : item.status === "waiting";
      result.push(isQueued && !stopRef.current ? await uploadOne(item) : item);
    }
    setIsRunning(false);
    return result;
  };

  return {
    items,
    isRunning,
    add: (files: File[]) =>
      setItems((current) => [
        ...current,
        ...files.map((file) => ({
          id: crypto.randomUUID(),
          file,
          fields: defaultFields(file),
          status: "waiting" as const,
          progress: 0,
        })),
      ]),
    remove: (id: string) =>
      setItems((current) => current.filter((item) => item.id !== id)),
    /** Merges upload field values into one file's fields. */
    setFields: ({
      id,
      fields,
    }: {
      id: string;
      fields: Record<string, string>;
    }) =>
      setItems((current) =>
        current.map((item) =>
          item.id === id
            ? { ...item, fields: { ...item.fields, ...fields } }
            : item,
        ),
      ),
    start: () => run(),
    retryFailed: () =>
      run(items.filter((item) => item.status === "failed").map((i) => i.id)),
    stop: () => {
      stopRef.current = true;
    },
  };
};

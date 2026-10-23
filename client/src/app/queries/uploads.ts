import { useMutation } from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  ArtifactResponse,
  AsyncOperationResponse,
  PaginatedArtifactResponseList,
  UploadResponse,
} from "@app/client";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import { waitForTask } from "./tasks";
import { CHUNK_SIZE, contentRange, planChunks } from "./utils/chunks";
import type { IMutationCallbacks } from "./utils/mutationCallbacks";
import type { DrfAxiosError } from "./utils/openapiErrorTypes";
import { pulpApiPath, toProxyHref } from "./utils/pulpApi";
import type { IPulpDomain } from "./utils/pulpApi";

/** Creates an upload of the file's size and PUTs each chunk; returns the upload href. */
const putChunks = async ({
  domain,
  file,
  onProgress,
}: {
  domain: IPulpDomain;
  file: File;
  onProgress?: (fraction: number) => void;
}) => {
  const { data: upload } = await axiosInstance.post<UploadResponse>(
    pulpApiPath("uploads/", domain),
    { size: file.size },
  );
  const href = upload.pulp_href ?? "";
  for (const chunk of planChunks({ size: file.size })) {
    const body = new FormData();
    body.append("file", file.slice(chunk.start, chunk.end));
    await axiosInstance.put(toProxyHref(href), body, {
      adapter: "xhr",
      headers: { "Content-Range": contentRange({ chunk, size: file.size }) },
      onUploadProgress: (event) =>
        onProgress?.((chunk.start + event.loaded) / file.size),
    });
  }
  return href;
};

/**
 * Sends a large file through the plugin-neutral `uploads/` API in chunks and returns
 * the upload href, which a content create/upload call takes as `upload` (no
 * `commit/` needed). Uses the XHR adapter so progress is reported in every browser.
 */
export const useChunkedUploadMutation = (
  options?: IMutationCallbacks<
    string,
    { file: File; onProgress?: (fraction: number) => void }
  >,
) => {
  const domain = useSelectedDomain();
  return useMutation<
    string,
    DrfAxiosError,
    { file: File; onProgress?: (fraction: number) => void }
  >({
    mutationFn: ({ file, onProgress }) =>
      putChunks({ domain, file, onProgress }),
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });
};

/** The file's SHA-256 as hex, the checksum Pulp keys artifacts on. */
const sha256Hex = async (file: File) => {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    await file.arrayBuffer(),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
};

/**
 * Stores a file as an Artifact and returns its href. An artifact with the same
 * SHA-256 is reused (Pulp rejects duplicates); otherwise one `artifacts/` POST, or
 * for a large file the chunked `uploads/` plus `commit/` (a task that creates it).
 */
export const useArtifactUploadMutation = (
  options?: IMutationCallbacks<
    string,
    { file: File; onProgress?: (fraction: number) => void }
  >,
) => {
  const domain = useSelectedDomain();
  return useMutation<
    string,
    DrfAxiosError,
    { file: File; onProgress?: (fraction: number) => void }
  >({
    mutationFn: async ({ file, onProgress }) => {
      const sha256 = await sha256Hex(file);
      const { data: existing } =
        await axiosInstance.get<PaginatedArtifactResponseList>(
          pulpApiPath("artifacts/", domain),
          { params: { sha256, limit: 1 } },
        );
      const reused = existing.results[0]?.pulp_href;
      if (reused) return reused;

      if (file.size <= CHUNK_SIZE) {
        const body = new FormData();
        body.append("file", file);
        const { data } = await axiosInstance.post<ArtifactResponse>(
          pulpApiPath("artifacts/", domain),
          body,
          {
            adapter: "xhr",
            onUploadProgress: (event) =>
              onProgress?.(event.total ? event.loaded / event.total : 0),
          },
        );
        return data.pulp_href ?? "";
      }
      const upload = await putChunks({ domain, file, onProgress });
      const { data } = await axiosInstance.post<AsyncOperationResponse>(
        `${toProxyHref(upload)}commit/`,
        { sha256 },
      );
      const task = await waitForTask(data.task);
      return task.created_resources?.[0] ?? "";
    },
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });
};

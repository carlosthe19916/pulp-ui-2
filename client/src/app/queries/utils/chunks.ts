/** Files above this size are sent in chunks through `uploads/`. */
export const CHUNK_SIZE = 6 * 1024 * 1024;

/** Splits `size` bytes into consecutive chunks (`start` inclusive, `end` exclusive). */
export const planChunks = ({
  size,
  chunkSize = CHUNK_SIZE,
}: {
  size: number;
  chunkSize?: number;
}): { start: number; end: number }[] => {
  const chunks: { start: number; end: number }[] = [];
  for (let start = 0; start < size; start += chunkSize) {
    chunks.push({ start, end: Math.min(start + chunkSize, size) });
  }
  return chunks;
};

/** The `Content-Range` header for a chunk: `bytes start-last/size` (last is inclusive). */
export const contentRange = ({
  chunk,
  size,
}: {
  chunk: { start: number; end: number };
  size: number;
}): string => `bytes ${chunk.start}-${chunk.end - 1}/${size}`;

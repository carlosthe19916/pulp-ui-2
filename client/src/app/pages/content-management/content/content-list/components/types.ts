import type { MultipleArtifactContentResponse } from "@app/client";

/**
 * A content unit from the aggregate `content/` list: the generated type plus the `artifacts`
 * map the generator drops (relative path → artifact href; null when not downloaded).
 */
export type IContentUnit = MultipleArtifactContentResponse & {
  artifacts?: Record<string, string | null>;
};

import type { EntityType } from "@catalog";

const ENTITY_LABELS: Record<EntityType, string> = {
  repository: "Repository",
  remote: "Remote",
  distribution: "Distribution",
  publication: "Publication",
};

/** An entity type's singular name, for titles and toasts. */
export const getEntityLabel = (entity: EntityType): string =>
  ENTITY_LABELS[entity];

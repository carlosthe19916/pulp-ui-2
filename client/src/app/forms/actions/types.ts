import type { IEntityField } from "@app/utils/entityField";

/** One repository type's action fields, by catalog action key (`[]`: no fields). */
export type ActionFields = Record<string, IEntityField[]>;

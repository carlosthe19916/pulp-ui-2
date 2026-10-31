import { defineForm } from "@app/plugin-forms";

import type { EntityType, IEndpointsByEntity } from "../definition";

/** The body a type's form edits: its create body, or the update body when Pulp can't create it. */
export type FormBody<
  E extends EntityType,
  P extends keyof IEndpointsByEntity[E],
> = IEndpointsByEntity[E][P] extends { create: infer C }
  ? C
  : IEndpointsByEntity[E][P] extends { update: infer U }
    ? U
    : never;

const formFor =
  <E extends EntityType>() =>
  <P extends keyof IEndpointsByEntity[E] & string>(_type: { apiPath: P }) =>
    defineForm<FormBody<E, P>, `${E}:${P}`>();

/**
 * `defineForm` typed from a definition's type: `remoteForm(rpm.remote["rpm.uln"])(builder)`
 * edits that collection's body, found through its apiPath.
 */
export const remoteForm = formFor<"remote">();
export const repositoryForm = formFor<"repository">();
export const distributionForm = formFor<"distribution">();
export const publicationForm = formFor<"publication">();

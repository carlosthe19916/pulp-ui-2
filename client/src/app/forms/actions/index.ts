import type { PulpType } from "@catalog";

import type { IEntityField } from "@app/utils/entityField";

import { ANSIBLE_ACTION_FIELDS } from "./ansible";
import {
  CONTAINER_ACTION_FIELDS,
  CONTAINER_PUSH_ACTION_FIELDS,
} from "./container";
import {
  DEB_ACTION_FIELDS,
  MAVEN_ACTION_FIELDS,
  PYTHON_ACTION_FIELDS,
  RPM_ACTION_FIELDS,
} from "./plugins";
import type { ActionFields } from "./types";

/**
 * The form fields of each catalog repository action, by repository pulp_type, then action
 * key. The catalog declares what an action is (endpoint, target); what it asks for is UI.
 */
export const REPOSITORY_ACTION_FIELDS: Record<PulpType, ActionFields> = {
  "ansible.ansible": ANSIBLE_ACTION_FIELDS,
  "container.container": CONTAINER_ACTION_FIELDS,
  "container.container-push": CONTAINER_PUSH_ACTION_FIELDS,
  "rpm.rpm": RPM_ACTION_FIELDS,
  "deb.deb": DEB_ACTION_FIELDS,
  "maven.maven": MAVEN_ACTION_FIELDS,
  "python.python": PYTHON_ACTION_FIELDS,
};

/** An action's fields; an action without an entry asks for nothing. */
export const getActionFields = ({
  repositoryType,
  actionKey,
}: {
  repositoryType: PulpType;
  actionKey: string;
}): IEntityField[] =>
  REPOSITORY_ACTION_FIELDS[repositoryType]?.[actionKey] ?? [];

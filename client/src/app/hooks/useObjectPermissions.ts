import type { VersionAction } from "@app/components/VersionActionModal";
import {
  useMyPermissionsQueries,
  useMyPermissionsQuery,
} from "@app/queries/access";

/** What an action needs on its object; `delete_version` is a repository's version delete. */
export type PermissionVerb =
  | "change"
  | "delete"
  | "sync"
  | "modify"
  | "repair"
  | "manage_roles"
  | "delete_version"
  | "refresh"
  | "replicate";

/** What each repository version action needs on the repository. */
export const VERSION_ACTION_VERBS: Record<VersionAction, PermissionVerb> = {
  restore: "modify",
  repair: "repair",
  delete: "delete_version",
};

const VERB_LABELS: Record<PermissionVerb, string> = {
  change: "change",
  delete: "delete",
  sync: "sync",
  modify: "change the content of",
  repair: "repair",
  manage_roles: "manage access to",
  delete_version: "delete versions of",
  refresh: "refresh",
  replicate: "replicate from",
};

/**
 * The permission an action needs, from the user's own permissions on the object
 * (`<app>.view_<model>` gives the app and model): `<app>.<verb>_<model>`.
 */
export const permissionFor = ({
  permissions,
  verb,
}: {
  permissions: string[];
  verb: PermissionVerb;
}): string | undefined => {
  const view = permissions.find((perm) => perm.includes(".view_"));
  if (!view) return undefined;
  const [app, codename] = view.split(".");
  const model = codename.slice("view_".length);
  return verb === "delete_version"
    ? `${app}.delete_${model}_version`
    : `${app}.${verb}_${model}`;
};

/**
 * Whether the permissions grant the verb. Plugins name content changes differently
 * (`modify_filerepository`, `modify_content_rpmrepository`,
 * `modify_ansible_repo_content`), so `modify` accepts any `<app>.modify_*`.
 */
export const hasPermission = ({
  permissions,
  verb,
}: {
  permissions: string[];
  verb: PermissionVerb;
}): boolean => {
  const permission = permissionFor({ permissions, verb });
  if (!permission) return false;
  if (verb === "modify") {
    const app = permission.split(".")[0];
    return permissions.some((perm) => perm.startsWith(`${app}.modify_`));
  }
  return permissions.includes(permission);
};

/** Props that disable a menu item or `GatedButton`, with the reason as its tooltip. */
const disabledPropsFor = ({
  allowed,
  verb,
}: {
  allowed: boolean;
  verb: PermissionVerb;
}) =>
  allowed
    ? {}
    : {
        isAriaDisabled: true,
        tooltipProps: {
          content: `You don't have permission to ${VERB_LABELS[verb]} this.`,
        },
      };

/**
 * Per-object permission checks for an object's actions. Until the permissions load
 * (or when they can't be read) nothing is disabled — the server still enforces.
 */
export const useObjectPermissions = ({ href }: { href: string }) => {
  const { data } = useMyPermissionsQuery({ href });

  const can = (verb: PermissionVerb): boolean =>
    !data || hasPermission({ permissions: data.permissions, verb });

  const disabledProps = (verb: PermissionVerb) =>
    disabledPropsFor({ allowed: can(verb), verb });

  return { can, disabledProps };
};

/** `useObjectPermissions` for several objects at once (a list page's rows). */
export const useObjectsPermissions = ({ hrefs }: { hrefs: string[] }) => {
  const byHref = useMyPermissionsQueries({ hrefs });

  const can = ({
    href,
    verb,
  }: {
    href?: string | null;
    verb: PermissionVerb;
  }): boolean => {
    const data = href ? byHref.get(href) : undefined;
    return !data || hasPermission({ permissions: data.permissions, verb });
  };

  const disabledProps = ({
    href,
    verb,
  }: {
    href?: string | null;
    verb: PermissionVerb;
  }) => disabledPropsFor({ allowed: can({ href, verb }), verb });

  return { can, disabledProps };
};

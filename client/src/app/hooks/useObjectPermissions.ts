import type { VersionAction } from "@app/components/VersionActionModal";
import { useMyPermissionsQuery } from "@app/queries/access";

/** What an action needs on its object; `delete_version` is a repository's version delete. */
export type PermissionVerb =
  | "change"
  | "delete"
  | "sync"
  | "modify"
  | "repair"
  | "manage_roles"
  | "delete_version";

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
 * Per-object permission checks for an object's actions. Until the permissions load
 * (or when they can't be read) nothing is disabled — the server still enforces.
 */
export const useObjectPermissions = ({ href }: { href: string }) => {
  const { data } = useMyPermissionsQuery({ href });

  const can = (verb: PermissionVerb): boolean => {
    if (!data) return true;
    const permission = permissionFor({ permissions: data.permissions, verb });
    return !!permission && data.permissions.includes(permission);
  };

  /** Props that disable a menu item, with the reason as its tooltip. */
  const disabledProps = (verb: PermissionVerb) =>
    can(verb)
      ? {}
      : {
          isAriaDisabled: true,
          tooltipProps: {
            content: `You don't have permission to ${VERB_LABELS[verb]} this.`,
          },
        };

  return { can, disabledProps };
};

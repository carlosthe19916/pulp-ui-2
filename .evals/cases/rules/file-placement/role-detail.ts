import dedent from "dedent";

import type { ICase } from "../../../lib/types.ts";

// Rule: .rulesync/rules/file-placement.md. Criteria come from its `## Checklist`.
// The roles pages are the scenario because the current code breaks the rule there
// (RoleModal's private pieces spread over the page's components/ and hooks/, plus an
// entity-level pages/admin/roles/utils/), so copying the code fails. Every existing context is
// app-wide and lives in @app/context/, so copying them puts the page-only context at the app
// root. A role list test also using the label helper checks that tests don't count towards a
// module's users. The prompt and criteria describe the end state only, so the case stays valid
// once that code is fixed.
export default {
  target: { rules: ["file-placement"] },
  prompt: dedent`
    We're adding a role detail page next to the role list page, with Details, Permissions and
    Assignments tabs. Its header gets an "Edit" action that opens the same RoleModal the role
    list uses to edit a role.

    Every tab needs the loaded role and a way to refresh it after an edit, and we'd rather share
    that through a React context than pass props down. Only this page and its tabs use the
    context.

    The Permissions and Assignments tabs both turn permission codenames into readable labels
    with a new helper, separate from anything RoleModal uses. A new unit test for the role list
    page will import that helper too, to build its expected labels.

    Don't write any code. List every file you would create, move, delete or change, each with its
    final path and one line on why.
  `,
  tools: "read",
  expect: {
    shared_to_app_root: dedent`
      RoleModal ends up under client/src/app/components/, because two pages now use it. It is
      not left in either page's directory.
    `,
    private_pieces_in_component_folder: dedent`
      The modules only RoleModal's own files use (its form component, the permission
      multi-select, the useRoleForm hook and the permission-options helper, with their tests) sit
      in RoleModal's folder next to RoleModal.tsx. None is moved to the top level of @app/hooks,
      @app/utils or @app/components, and none is left in a page directory. Each one that sits
      outside RoleModal's folder today must be explicitly moved; an answer that leaves out or
      doesn't mention one of them (the permission-options helper included) fails this criterion.
    `,
    flat_folder: dedent`
      RoleModal gets its own folder holding RoleModal.tsx, its private modules and an index.ts.
      The folder is flat: no components/, hooks/ or utils/ inside it.
    `,
    no_area_dirs: dedent`
      After the change, no components/, hooks/, utils/ or context/ directory exists directly
      under pages/admin/ or pages/admin/roles/; any such directory is emptied and removed. Moving
      every file out of a directory counts as removing it, even if the answer doesn't say so.
      Ones inside a page directory (pages/admin/roles/<page>/components/) are fine.
    `,
    page_dir: dedent`
      The new page gets its own directory next to role-list under pages/admin/roles/ (any name).
      Its root holds only the page's main component and its route-to-component adapter
      (RoleDetailRoute.tsx or similar). The three tab components live in that page directory's
      components/, because only that page uses them: not loose in its root, not in
      client/src/app/components/, and not in a differently named sub-directory such as tabs/.
    `,
    page_context: dedent`
      The context lives inside the new page's directory, not in client/src/app/context/, because
      only that page uses it. Its files sit together in a context/<Name>/ folder named after the
      context (e.g. context/RoleDetail/); a bare context/ folder holding the files directly, or
      files loose in the page root, fails this criterion.
    `,
    context_provider_pair: dedent`
      The context is split into two files: <Name>Context.tsx holding the createContext call and
      the value type, and <Name>Provider.tsx holding the provider component. The createContext
      call and the provider are never in the same file.
    `,
    page_utils: dedent`
      The permission-label helper lives in the new page directory's utils/, because two tabs of
      that one page use it: not in client/src/app/utils/, not inside one tab's file or folder,
      not in the context's folder and not in RoleModal's folder. The role list test importing it
      doesn't move it to the app root, because tests don't count as users.
    `,
  },
} satisfies ICase;

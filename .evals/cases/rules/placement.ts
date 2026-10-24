import dedent from "dedent";

import type { ICase } from "../../lib/types.ts";

// Rule: .rulesync/rules/placement.md. Criteria come from its `## Checklist`.
export default {
  prompt: dedent`
    We're adding a role detail page next to the role list page. It needs PermissionMultiSelect,
    which today only the role list page uses.

    Don't write any code. List every file you would create, move or change, each with one line on
    why, and the import line each page would use for PermissionMultiSelect.
  `,
  tools: ["Read", "Glob", "Grep"],
  expect: {
    shared_to_app_root: dedent`
      PermissionMultiSelect moves to the app-root components layer (client/src/app/components/),
      because two pages now use it. Neither page imports it from inside the other page's directory.
    `,
    no_area_dirs: dedent`
      No components/, hooks/ or utils/ directory is created directly under an area or entity
      directory, such as pages/admin/ or pages/admin/roles/. Ones inside a page directory
      (pages/admin/roles/<page>/components/) are fine.
    `,
    alias_imports: dedent`
      Both pages import PermissionMultiSelect through the @app/components alias, not a relative
      path.
    `,
    page_dir: dedent`
      The new page gets its own directory next to role-list under pages/admin/roles/ (any name),
      with its main component at that directory's root.
    `,
  },
} satisfies ICase;

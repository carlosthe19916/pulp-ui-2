import dedent from "dedent";

import type { ICase } from "../../../lib/types.ts";

// Rule: .rulesync/rules/file-placement.md: a context used inside one component folder. Every
// existing context lives in @app/context/<Name>/, so copying them puts this one at the app root
// or in a context/ sub-directory; the rule wants the pair flat in the component's folder.
export default {
  target: { rules: ["file-placement"] },
  prompt: dedent`
    In UploadContentModal, UploadFilesForm and UploadProgress both get the upload queue state as
    props from UploadContentModal. We want to share it through a React context instead. Nothing
    outside UploadContentModal uses that context.

    Don't write any code. List every file you would create or change, each with its path and one
    line on what it holds.
  `,
  tools: "read",
  expect: {
    component_scope: dedent`
      The context's files sit in UploadContentModal's own folder
      (client/src/app/components/UploadContentModal/), not in client/src/app/context/ and not in
      any page directory.
    `,
    flat: dedent`
      The context's files sit directly in that folder, next to UploadContentModal.tsx: no
      context/ (or other) sub-directory is created inside UploadContentModal/.
    `,
    context_provider_pair: dedent`
      The context is split into two files: <Name>Context.ts holding the createContext call and
      the value type, and <Name>Provider.tsx holding the provider component. The createContext
      call and the provider are never in the same file.
    `,
  },
} satisfies ICase;

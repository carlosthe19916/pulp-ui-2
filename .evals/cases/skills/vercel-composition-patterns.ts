import dedent from "dedent";

import type { ICase } from "../../lib/types.ts";

// Skill: .agents/skills/vercel-composition-patterns/. Criteria come from its rules
// state-context-interface, architecture-avoid-boolean-props and react19-no-forwardref.
export default {
  target: { skills: ["vercel-composition-patterns"] },
  prompt: dedent`
    Several list pages need the same filter toolbar: a search box, sometimes a domain selector,
    sometimes a compact layout. The first draft is one FilterToolbar component with showSearch,
    showDomainSelect and isCompact props, and it keeps growing.

    Don't write the implementation. Design the component API: show the TSX a page would write to
    use it, the TypeScript type of any context the parts share, and how a part reads that context.
  `,
  tools: "read",
  expect: {
    no_boolean_modes: dedent`
      The optional parts (search box, domain selector) are composed as children or explicit
      variant components, not switched on and off by boolean props.
    `,
    context_interface: dedent`
      The shared context value is split into three parts named state, actions and meta (or very
      close names), not a flat bag of values and setters.
    `,
    use_not_use_context: dedent`
      Parts read the context with React 19's use(), not useContext().
    `,
  },
} satisfies ICase;

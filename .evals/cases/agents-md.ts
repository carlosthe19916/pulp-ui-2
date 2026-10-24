import dedent from "dedent";

import type { ICase } from "../lib/types.ts";

// Only AGENTS.md knows this answer, and the agent has no tools to look it up.
export default {
  prompt: dedent`
    Answer from the project instructions already in your context. What is the name of the \
    function the dev-server /api proxy uses to rewrite /api/pulp to Pulp's API_ROOT? Reply with \
    only the function name, or UNKNOWN.
  `,
  expect: {
    names_function: `The answer names the function rewritePulpApiPath (and does not answer UNKNOWN).`,
  },
} satisfies ICase;

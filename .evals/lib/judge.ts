import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import dedent from "dedent";
import { z } from "zod";

// The grader, not the agent under test: the same model whichever vendor answered.
const MODEL = "claude-opus-4-8";

export const PASS_SCORE = 4;

const TIMEOUT_MS = 2 * 60_000;

// claude-opus-4-8 list prices in USD per token, for a cost estimate.
const USD_PER_INPUT_TOKEN = 5 / 1e6;
const USD_PER_OUTPUT_TOKEN = 25 / 1e6;

const client = new Anthropic();
const Score = z.number().int().min(0).max(5);

// Scores an answer 0–5 per criterion. `messages.parse` + `zodOutputFormat` make the API enforce
// the schema, so the verdict arrives typed with no JSON extraction.
export async function judge({
  criteria,
  task,
  answer,
}: {
  criteria: Record<string, string>;
  task: string;
  answer: string;
}) {
  // With no criteria every score check passes, so an empty `expect` would always pass.
  if (!Object.keys(criteria).length) {
    throw new Error("judge needs at least one criterion");
  }

  const Verdict = z.object({
    scores: z.object(
      Object.fromEntries(Object.keys(criteria).map((k) => [k, Score])),
    ),
    comment: z.string(),
  });

  const response = await client.messages.parse(
    {
      model: MODEL,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      system: dedent`
        Please evaluate the answer to the task based on each of the following criteria:

        ${Object.entries(criteria)
          .map(([k, v]) => `${k}: ${v}`)
          .join("\n\n")}

        For each criterion, give an integer score between 0 and 5 (higher = better). Use the comment to explain every score below 5.
      `,
      messages: [
        {
          role: "user",
          // Not dedent: it also strips indentation inside the agent's answer.
          content: `<task>
${task}
</task>

<answer>
${answer}
</answer>`,
        },
      ],
      output_config: { format: zodOutputFormat(Verdict) },
    },
    { timeout: TIMEOUT_MS },
  );

  if (!response.parsed_output) {
    throw new Error(
      `judge returned no verdict (stop_reason: ${response.stop_reason})`,
    );
  }

  const costUsd =
    response.usage.input_tokens * USD_PER_INPUT_TOKEN +
    response.usage.output_tokens * USD_PER_OUTPUT_TOKEN;

  return { ...response.parsed_output, costUsd };
}

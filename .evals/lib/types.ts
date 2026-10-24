// What a case lets the agent do, in vendor-neutral terms: nothing, or read and search the repo.
// Each vendor maps it to its own tools.
export type Tools = "none" | "read";

// Every case also runs without the repo's AI guidance, and that run must fail; otherwise the
// existing code or the base model teaches the behaviour, not the guidance.
export interface ICase {
  prompt: string;
  // "none" by default.
  tools?: Tools;
  // Criteria the judge scores 0–5, keyed by a short name.
  expect: Record<string, string>;
}

// The vendor-locked part of an agent run: one coding agent answering a prompt in `cwd`, a
// throwaway copy of the repo that the runner prepares and removes. Everything else (the copy,
// the timeout, the judge, the report) is shared, so a new vendor is one object in lib/vendors/.
export interface IVendor {
  // Guidance only this vendor reads, removed from the copy (with every other vendor's) when
  // `guidance` is false.
  guidance: string[];
  run(opts: {
    prompt: string;
    cwd: string;
    tools: Tools;
    // False when the repo's guidance was removed; skip loading project settings too.
    guidance: boolean;
    // Aborted on timeout; the vendor must stop the agent.
    signal: AbortSignal;
  }): Promise<{
    answer: string;
    // Undefined when the vendor doesn't report what the run cost.
    costUsd?: number;
  }>;
}

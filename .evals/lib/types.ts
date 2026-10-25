// What a case lets the agent do, in vendor-neutral terms: nothing, or read and search the repo.
// Each vendor maps it to its own tools.
export type ToolAccess = "none" | "read";

// The guidance a case tests. Its run with guidance keeps only these and removes the rest, so a
// pass means they alone teach the behaviour, not some other guidance file.
export interface ITarget {
  // Rule names, as in .rulesync/rules/<name>.md; every vendor's generated copy is kept too.
  rules?: string[];
  // Skill names, as in .agents/skills/<name>/; every vendor's link to it is kept too.
  skills?: string[];
  // Any other guidance to keep, e.g. AGENTS.md or an ADR.
  paths?: string[];
}

// Every case runs twice: with only its target guidance, which must pass, and without the repo's
// AI guidance, which must fail; otherwise the existing code or the base model teaches the
// behaviour, not the guidance.
export interface ICase {
  prompt: string;
  target: ITarget;
  // "none" by default.
  tools?: ToolAccess;
  // Criteria the judge scores 0–5, keyed by a short name.
  expect: Record<string, string>;
}

// The vendor-locked part of an agent run: one coding agent answering a prompt in `cwd`, a
// throwaway copy of the repo that the runner prepares and removes. Everything else (the copy,
// the timeout, the judge, the report) is shared, so a new vendor is one object in lib/vendors/.
export interface IVendor {
  // Guidance only this vendor reads, removed from the copy (with every other vendor's) for runs
  // without guidance.
  guidancePaths: string[];
  // Where this vendor's generated copy of a rule lives, e.g. ".claude/rules/<name>.md".
  rulePath(name: string): string;
  // Where this vendor finds a skill, e.g. ".claude/skills/<name>"; undefined when it has no
  // project skills directory of its own.
  skillPath?(name: string): string;
  run(options: {
    prompt: string;
    cwd: string;
    tools: ToolAccess;
    // False when all of the repo's guidance was removed; skip loading project settings too.
    withGuidance: boolean;
    // Aborted on timeout; the vendor must stop the agent.
    signal: AbortSignal;
  }): Promise<{
    answer: string;
    // Undefined when the vendor doesn't report what the run cost.
    costUsd?: number;
    // Guidance files the agent loaded, relative to `cwd`; undefined when the vendor can't tell.
    loadedGuidance?: string[];
  }>;
}

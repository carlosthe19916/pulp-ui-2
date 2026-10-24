// Every case also runs without the repo's AI guidance, and that run must fail; otherwise the
// existing code or the base model teaches the behaviour, not the guidance.
export interface ICase {
  prompt: string;
  // Tools the agent may use; none by default.
  tools?: string[];
  // Criteria the judge scores 0–5, keyed by a short name.
  expect: Record<string, string>;
}

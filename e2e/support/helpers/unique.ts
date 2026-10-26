import { randomUUID } from "node:crypto";

/**
 * Shared prefix for every record these tests create, so leftovers are easy to
 * spot (and sweep) in a shared Pulp instance.
 */
export const E2E_PREFIX = "e2e";

/**
 * A globally-unique name for a test-owned record. Unique across parallel workers
 * so each test can create, assert on, and delete its own data without collisions.
 */
export const uniqueName = (kind: string): string =>
  `${E2E_PREFIX}-${kind}-${randomUUID().slice(0, 8)}`;

/**
 * A password that satisfies Pulp's (Django) password validators — long enough
 * and not on the common-password blocklist, so user creation isn't rejected.
 */
export const STRONG_PASSWORD = "Pulp-e2e-Xk92mfz!";

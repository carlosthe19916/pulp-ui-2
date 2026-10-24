import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));

// Copies still on disk, removed on exit too so Ctrl+C doesn't leave them behind.
const copies = new Set<string>();
const removeCopy = (dir: string) => {
  rmSync(dir, { recursive: true, force: true });
  copies.delete(dir);
};
process.on("exit", () => copies.forEach(removeCopy));
for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.once(signal, () => process.exit(1));
}

// Runs `fn` in a throwaway copy of the working tree (uncommitted edits included, ignored files
// and `drop` excluded), so the agent can't read what's dropped and can't touch the real checkout.
export async function withRepoCopy<T>(
  drop: string[],
  fn: (dir: string) => Promise<T>,
) {
  const dir = mkdtempSync(join(tmpdir(), "pulp-ui-evals-"));
  copies.add(dir);
  try {
    const files = execFileSync(
      "git",
      ["ls-files", "-z", "-co", "--exclude-standard"],
      {
        cwd: repoRoot,
        encoding: "utf8",
      },
    ).split("\0");
    for (const file of files) {
      if (!file || drop.some((d) => file.startsWith(d))) continue;
      // ls-files still lists tracked files deleted from the working tree.
      if (!existsSync(join(repoRoot, file))) continue;
      cpSync(join(repoRoot, file), join(dir, file), { recursive: true });
    }
    return await fn(dir);
  } finally {
    removeCopy(dir);
  }
}

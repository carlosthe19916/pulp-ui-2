import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));

// Copies still on disk, removed on exit too so Ctrl+C doesn't leave them behind.
const liveCopies = new Set<string>();
const removeCopy = (dir: string) => {
  rmSync(dir, { recursive: true, force: true });
  liveCopies.delete(dir);
};
process.on("exit", () => liveCopies.forEach(removeCopy));
for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.once(signal, () => process.exit(1));
}

// Runs `work` in a throwaway copy of the working tree (uncommitted edits included, ignored files
// and `excludedPaths` left out), so the agent can't read what's left out and can't touch the real
// checkout.
export async function withRepoCopy<T>(
  excludedPaths: string[],
  work: (dir: string) => Promise<T>,
) {
  const dir = mkdtempSync(join(tmpdir(), "pulp-ui-evals-"));
  liveCopies.add(dir);
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
      if (!file || excludedPaths.some((prefix) => file.startsWith(prefix))) {
        continue;
      }
      // ls-files still lists tracked files deleted from the working tree.
      if (!existsSync(join(repoRoot, file))) continue;
      // verbatimSymlinks keeps relative links relative, so they resolve inside the copy instead
      // of back into the real checkout.
      cpSync(join(repoRoot, file), join(dir, file), {
        recursive: true,
        verbatimSymlinks: true,
      });
    }
    return await work(dir);
  } finally {
    removeCopy(dir);
  }
}

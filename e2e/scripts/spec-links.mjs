// Keeps each spec-linked e2e test linked to its spec scenario.
//
//   node scripts/spec-links.mjs           # check (CI): fail on drift or broken coverage
//   node scripts/spec-links.mjs --write   # fix: title, tag, annotation and the scenario doc
//
// Each scenario in e2e/specs/*.md has `### <ID> <label>`, a `Summary:` line and a body.
// Every spec-linked browser test (a tests/**/*.spec.ts, not *.api.spec.ts, carrying an @<ID>
// tag or an ID-prefixed title) carries:
//   - a Playwright tag  @<ID>                         (filterable; the machine id)
//   - an annotation     { type: "spec", description } (the spec ref, shown in the report)
//   - a generated JSDoc block above it                (the scenario text, inline)
//   - its title = the scenario's `Summary:`           (single-test scenarios only)
// Scenarios split into several tests, or with a `${…}` template title, keep their own titles.

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import prettier from "prettier";

const E2E_ROOT = path.resolve(fileURLToPath(import.meta.url), "..", "..");
const SPEC_DIR = path.join(E2E_ROOT, "specs");
const SPEC_FILES = [
  "users.md",
  "groups.md",
  "roles.md",
  "access-policies.md",
  "domains.md",
];
// Scan the whole test tree: transform() only acts on tests carrying an @<ID> tag or an
// ID-prefixed title, so untagged specs elsewhere are left untouched.
const TESTS_DIR = path.join(E2E_ROOT, "tests");

/** id → { specRel, label, summary, body[] } from the spec headings and bodies. */
function parseSpecs() {
  const byId = new Map();
  const errors = [];
  for (const file of SPEC_FILES) {
    const lines = readFileSync(path.join(SPEC_DIR, file), "utf8").split("\n");
    for (let i = 0; i < lines.length; i++) {
      const m = /^### ([A-Z][A-Z0-9-]*-\d+)\s+(.+?)\s*$/.exec(lines[i]);
      if (!m) continue;
      const [, id, label] = m;
      const body = [];
      for (let j = i + 1; j < lines.length && !/^#{2,3}\s/.test(lines[j]); j++)
        body.push(lines[j].replace(/\s+$/, ""));
      while (body.length && body[0] === "") body.shift();
      while (body.length && body.at(-1) === "") body.pop();
      const summary = body
        .find((l) => /^Summary:\s*\S/.test(l))
        ?.replace(/^Summary:\s*/, "");
      if (!summary)
        errors.push(`e2e/specs/${file}: ${id} has no "Summary:" line`);
      byId.set(id, { specRel: `e2e/specs/${file}`, label, summary, body });
    }
  }
  return { byId, errors };
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (full.endsWith(".spec.ts") && !full.endsWith(".api.spec.ts"))
      out.push(full);
  }
  return out;
}

function titlePrefix(node) {
  let text;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
    text = node.text;
  else if (ts.isTemplateExpression(node)) text = node.head.text;
  else return undefined;
  const m = /^([A-Z][A-Z0-9-]*-\d+)\s/.exec(text);
  return m ? m[1] : undefined;
}

const isPlainTitle = (node) =>
  ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node);

function existingTags(detailsNode) {
  const tags = [];
  if (!detailsNode || !ts.isObjectLiteralExpression(detailsNode)) return tags;
  for (const prop of detailsNode.properties) {
    if (!ts.isPropertyAssignment(prop) || prop.name.getText() !== "tag")
      continue;
    const v = prop.initializer;
    const lits = ts.isArrayLiteralExpression(v) ? v.elements : [v];
    for (const lit of lits) if (ts.isStringLiteral(lit)) tags.push(lit.text);
  }
  return tags;
}

const detailsText = (id, spec, keepTags) => {
  const tags = [...keepTags.filter((t) => !/^@[A-Z]/.test(t)), `@${id}`];
  const tag =
    tags.length === 1
      ? `"${tags[0]}"`
      : `[${tags.map((t) => `"${t}"`).join(", ")}]`;
  return `{ tag: ${tag}, annotation: { type: "spec", description: "${spec.specRel}#${id}" } }`;
};

const jsdocBlock = (id, spec, indent) => {
  const lines = [`${id} · ${spec.label}`, "", ...spec.body];
  const body = lines.map((l) => `${indent} *${l ? ` ${l}` : ""}`).join("\n");
  return `/**\n${body}\n${indent} */\n${indent}`;
};

/** Apply title/tag/annotation/doc edits to one file. Returns { code, ids, errors }. */
function transform(file, specs) {
  const src = readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true);
  const edits = [];
  const ids = [];
  const errors = [];
  const lineStartOf = (pos) => src.lastIndexOf("\n", pos - 1) + 1;

  // Pass 1: collect test calls and their id (from tag, else leading title token).
  const tests = [];
  const visit = (node) => {
    if (
      ts.isCallExpression(node) &&
      node.expression.getText(sf) === "test" &&
      node.arguments.length >= 1
    ) {
      const title = node.arguments[0];
      const second = node.arguments[1];
      const tags = existingTags(second);
      const idFromTag = tags
        .find((t) => /^@[A-Z][A-Z0-9-]*-\d+$/.test(t))
        ?.slice(1);
      const id = titlePrefix(title) ?? idFromTag;
      if (id) tests.push({ node, title, second, tags, id });
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);

  const countById = new Map();
  for (const t of tests) countById.set(t.id, (countById.get(t.id) ?? 0) + 1);

  // Pass 2: build edits.
  for (const { node, title, second, tags, id } of tests) {
    ids.push(id);
    const spec = specs.get(id);
    if (!spec) {
      errors.push(`${rel(file)}: test @${id} has no scenario in e2e/specs/`);
      continue;
    }
    // Title: the sole plain-string test of a scenario gets the spec summary.
    if (countById.get(id) === 1 && isPlainTitle(title) && spec.summary)
      edits.push({
        start: title.getStart(sf),
        end: title.getEnd(),
        text: JSON.stringify(spec.summary),
      });
    // Tag + annotation.
    const details = detailsText(id, spec, tags);
    const hasDetails = second && ts.isObjectLiteralExpression(second);
    if (hasDetails)
      edits.push({
        start: second.getStart(sf),
        end: second.getEnd(),
        text: details,
      });
    else
      edits.push({
        start: title.getEnd(),
        end: title.getEnd(),
        text: `, ${details}`,
      });
    // Inline scenario doc: drop any old `// spec:` line or prior JSDoc, then insert.
    const stmt =
      node.parent && ts.isExpressionStatement(node.parent) ? node.parent : node;
    const ours = new RegExp(`^/\\*\\*\\s*\\n\\s*\\*\\s*${id} ·`);
    for (const c of ts.getLeadingCommentRanges(src, stmt.getFullStart()) ??
      []) {
      const txt = src.slice(c.pos, c.end);
      if (txt.startsWith("// spec:") || ours.test(txt)) {
        const le = src.indexOf("\n", c.end);
        edits.push({
          start: lineStartOf(c.pos),
          end: le === -1 ? src.length : le + 1,
          text: "",
        });
      }
    }
    const indent = src.slice(lineStartOf(stmt.getStart(sf)), stmt.getStart(sf));
    edits.push({
      start: stmt.getStart(sf),
      end: stmt.getStart(sf),
      text: jsdocBlock(id, spec, indent),
    });
  }

  let code = src;
  for (const e of edits.sort((a, b) => b.start - a.start))
    code = code.slice(0, e.start) + e.text + code.slice(e.end);
  return { code, ids, errors };
}

const rel = (f) => path.relative(path.join(E2E_ROOT, ".."), f);

async function main() {
  const write = process.argv.includes("--write");
  const { byId: specs, errors: specErrors } = parseSpecs();
  const used = new Set();
  const problems = [...specErrors];
  let changed = 0;

  for (const file of walk(TESTS_DIR)) {
    const { code, ids, errors } = transform(file, specs);
    problems.push(...errors);
    // Only touch files with spec-linked tests; a spec elsewhere (its own prettier
    // config, no @<ID> tags) is left entirely alone — never reformatted or flagged.
    if (ids.length === 0) continue;
    ids.forEach((id) => used.add(id));
    const options = await prettier.resolveConfig(file);
    const formatted = await prettier.format(code, {
      ...options,
      filepath: file,
    });
    if (formatted !== readFileSync(file, "utf8")) {
      if (write) {
        writeFileSync(file, formatted);
        console.log(`  updated ${rel(file)}`);
      } else {
        problems.push(
          `${rel(file)}: scenario doc/title out of date (run: npm run spec:links:fix -w e2e)`,
        );
      }
      changed++;
    }
  }

  for (const id of specs.keys())
    if (!used.has(id))
      problems.push(`scenario ${id} has no test tagged @${id}`);

  if (problems.length) {
    console.error("\nspec-links problems:");
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }
  console.log(
    write
      ? `spec-links: ${changed} file(s) updated, ${used.size} scenarios linked`
      : `spec-links: OK (${used.size} scenarios linked across specs)`,
  );
}

main();

/**
 * Post-process @hey-api/openapi-ts output so Pulp `*_href` path params are not
 * percent-encoded (they are full URL paths), and so getUrl()'s leading '/' does
 * not create protocol-relative URLs like `//api/pulp/...`.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const target = join(root, "src/app/client/core/utils.gen.ts");

const marker = "protocol-relative URLs like";

const text = readFileSync(target, "utf8");

if (text.includes(marker)) {
  console.log("patch-openapi-client: already patched");
  process.exit(0);
}

const pattern =
  /const replaceValue = encodeURIComponent\(\s*style === 'label' \? `\.\${value as string}` : \(value as string\),\s*\);\s*url = url\.replace\(match, replaceValue\);/;

const replacement = `// Pulp href path params are full URL paths (e.g. /api/pulp/.../users/1/).
      // Percent-encoding them breaks the request; leave path-like values intact.
      // getUrl() may prepend '/', so strip a leading slash from the href to avoid
      // protocol-relative URLs like //api/pulp/... .
      const rawValue = style === 'label' ? \`.\${value as string}\` : (value as string);
      const isHrefPath = name.endsWith('_href') || rawValue.includes('/');
      let replaceValue = isHrefPath ? rawValue : encodeURIComponent(rawValue);
      if (isHrefPath && replaceValue.startsWith('/')) {
        const matchIndex = url.indexOf(match);
        if (matchIndex > 0 && url[matchIndex - 1] === '/') {
          replaceValue = replaceValue.slice(1);
        }
      }
      url = url.replace(match, replaceValue);`;

if (!pattern.test(text)) {
  // Allow re-patching from an older partial patch that still has endsWith('_href')
  if (text.includes("name.endsWith('_href')")) {
    console.log(
      "patch-openapi-client: partial patch detected; rewrite file section manually if needed",
    );
  }
  console.error("patch-openapi-client: expected serializer snippet not found");
  process.exit(1);
}

writeFileSync(target, text.replace(pattern, replacement));
console.log("patch-openapi-client: patched utils.gen.ts");

// Fails CI if code reads an env var that is not documented in .env.example,
// or if a NEXT_PUBLIC_ variable looks like it carries a secret.
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const IGNORED = new Set(["NODE_ENV", "NEXT_RUNTIME", "CI"]);

const documented = new Set(
  readFileSync(".env.example", "utf8")
    .split("\n")
    .map((l) => l.match(/^([A-Z][A-Z0-9_]*)=/)?.[1])
    .filter(Boolean),
);

const used = new Set();
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(ts|tsx|mjs|js)$/.test(name)) {
      const text = readFileSync(p, "utf8");
      for (const m of text.matchAll(/process\.env\.([A-Z][A-Z0-9_]*)/g)) used.add(m[1]);
      if (p.endsWith(join("lib", "env.ts"))) {
        for (const m of text.matchAll(/^\s+([A-Z][A-Z0-9_]+):\s*z\./gm)) used.add(m[1]);
      }
    }
  }
}
if (existsSync("src")) walk("src");

const errors = [];
for (const v of used) {
  if (!IGNORED.has(v) && !documented.has(v)) errors.push(`${v} is used in code but missing from .env.example`);
}
for (const v of [...used, ...documented]) {
  if (v.startsWith("NEXT_PUBLIC_") && /(SECRET|PRIVATE|PASSWORD|TOKEN|KEY)/.test(v)) {
    errors.push(`${v} must not be a browser-exposed variable`);
  }
}

if (errors.length) {
  console.error(errors.map((e) => `- ${e}`).join("\n"));
  process.exit(1);
}
console.log(`Environment documentation OK (${used.size} variables checked).`);

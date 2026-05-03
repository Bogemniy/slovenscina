// One-shot extractor: pulls WORDS / VERBS / SENTENCES / taxonomy out of the legacy
// index.html and writes data/*.jsonl + data/taxonomy.json.
// Runs on Node ≥18. After data/ is committed, this script can stay as a reference.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const html = readFileSync(resolve(root, "index.html"), "utf8");

function extractLiteral(name, openChar, closeChar) {
  const anchor = new RegExp(`const\\s+${name}\\s*=\\s*\\${openChar}`);
  const m = anchor.exec(html);
  if (!m) throw new Error(`Could not find literal for ${name}`);
  let depth = 0;
  let start = m.index + m[0].length - 1; // points at the opening bracket
  let i = start;
  let inStr = null;
  let escape = false;
  while (i < html.length) {
    const ch = html[i];
    if (escape) { escape = false; i++; continue; }
    if (inStr) {
      if (ch === "\\") escape = true;
      else if (ch === inStr) inStr = null;
    } else {
      if (ch === '"' || ch === "'" || ch === "`") inStr = ch;
      else if (ch === openChar) depth++;
      else if (ch === closeChar) {
        depth--;
        if (depth === 0) { i++; break; }
      }
    }
    i++;
  }
  const body = html.slice(start, i);
  return Function(`"use strict"; return (${body});`)();
}

const evalArrayLiteral = (name) => extractLiteral(name, "[", "]");
const evalObjectLiteral = (name) => extractLiteral(name, "{", "}");

function writeJSONL(file, rows) {
  const lines = rows.map((r) => JSON.stringify(r)).join("\n") + "\n";
  writeFileSync(file, lines, "utf8");
  console.log(`✓ ${file} — ${rows.length} rows`);
}

mkdirSync(resolve(root, "data"), { recursive: true });

const WORDS = evalArrayLiteral("WORDS");
const VERBS = evalArrayLiteral("VERBS");
const SENTENCES = evalArrayLiteral("SENTENCES");
const PRONOUNS = evalArrayLiteral("PRONOUNS");
const PRONOUN_SHORT = evalObjectLiteral("PRONOUN_SHORT");
const SPECIAL_NEG = evalObjectLiteral("SPECIAL_NEG");
const RELATED = evalObjectLiteral("RELATED");

writeJSONL(resolve(root, "data/words.jsonl"), WORDS);
writeJSONL(resolve(root, "data/verbs.jsonl"), VERBS);
writeJSONL(resolve(root, "data/sentences.jsonl"), SENTENCES);

const taxonomy = { pronouns: PRONOUNS, pronounShort: PRONOUN_SHORT, specialNeg: SPECIAL_NEG, related: RELATED };
writeFileSync(resolve(root, "data/taxonomy.json"), JSON.stringify(taxonomy, null, 2) + "\n", "utf8");
console.log(`✓ data/taxonomy.json`);

console.log(`\nDone. Sanity:`);
console.log(`  words=${WORDS.length} verbs=${VERBS.length} sentences=${SENTENCES.length}`);
console.log(`  pronouns=${PRONOUNS.length} specialNeg=${Object.keys(SPECIAL_NEG).length} relatedKeys=${Object.keys(RELATED).length}`);

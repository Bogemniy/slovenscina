// Validates data/*.jsonl and data/taxonomy.json on PR / push.
// Each JSONL line must parse cleanly and match a minimal schema.
// Words must have unique sl. Verbs must have all 9 pronoun forms.
// Sentence categories must reference taxonomy entries that exist.

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];

function err(file, line, msg) {
  errors.push(`${file}:${line ?? "?"} ${msg}`);
}

function parseJSONLFile(file) {
  const text = readFileSync(resolve(root, file), "utf8");
  const rows = [];
  text.split("\n").forEach((raw, i) => {
    const line = raw.trim();
    if (!line) return;
    try { rows.push({ line: i + 1, value: JSON.parse(line) }); }
    catch (e) { err(file, i + 1, `JSON parse error: ${e.message}`); }
  });
  return rows;
}

// --- taxonomy ---
let taxonomy = { pronouns: [], related: {}, specialNeg: {}, pronounShort: {} };
if (existsSync(resolve(root, "data/taxonomy.json"))) {
  try { taxonomy = JSON.parse(readFileSync(resolve(root, "data/taxonomy.json"), "utf8")); }
  catch (e) { err("data/taxonomy.json", null, `parse error: ${e.message}`); }
}
const knownCats = new Set(Object.keys(taxonomy.related || {}));

// --- words ---
const words = parseJSONLFile("data/words.jsonl");
const seenSl = new Map();
for (const { line, value: w } of words) {
  if (typeof w !== "object" || w === null) { err("data/words.jsonl", line, "not an object"); continue; }
  for (const k of ["sl", "ru", "cat"]) {
    if (typeof w[k] !== "string" || !w[k].trim()) err("data/words.jsonl", line, `missing or empty "${k}"`);
  }
  if (knownCats.size && w.cat && !knownCats.has(w.cat)) {
    err("data/words.jsonl", line, `unknown category "${w.cat}" (not in taxonomy.related)`);
  }
  if (w.sl) {
    if (seenSl.has(w.sl)) err("data/words.jsonl", line, `duplicate sl "${w.sl}" (first at line ${seenSl.get(w.sl)})`);
    else seenSl.set(w.sl, line);
  }
}

// --- verbs ---
const verbs = parseJSONLFile("data/verbs.jsonl");
const requiredPronouns = taxonomy.pronouns || [];
const seenInf = new Map();
for (const { line, value: v } of verbs) {
  if (typeof v !== "object" || v === null) { err("data/verbs.jsonl", line, "not an object"); continue; }
  for (const k of ["inf", "ru"]) {
    if (typeof v[k] !== "string" || !v[k].trim()) err("data/verbs.jsonl", line, `missing or empty "${k}"`);
  }
  if (!v.forms || typeof v.forms !== "object") {
    err("data/verbs.jsonl", line, `missing forms object`);
  } else {
    for (const p of requiredPronouns) {
      if (typeof v.forms[p] !== "string" || !v.forms[p].trim()) {
        err("data/verbs.jsonl", line, `missing form for pronoun "${p}"`);
      }
    }
  }
  if (v.inf) {
    if (seenInf.has(v.inf)) err("data/verbs.jsonl", line, `duplicate inf "${v.inf}" (first at line ${seenInf.get(v.inf)})`);
    else seenInf.set(v.inf, line);
  }
}

// --- sentences ---
const sents = parseJSONLFile("data/sentences.jsonl");
for (const { line, value: s } of sents) {
  if (typeof s !== "object" || s === null) { err("data/sentences.jsonl", line, "not an object"); continue; }
  if (!Array.isArray(s.sl) || s.sl.length === 0) err("data/sentences.jsonl", line, `"sl" must be non-empty array of strings`);
  else if (s.sl.some((t) => typeof t !== "string" || !t)) err("data/sentences.jsonl", line, `"sl" contains non-string token`);
  if (typeof s.ru !== "string" || !s.ru.trim()) err("data/sentences.jsonl", line, `missing "ru"`);
  if (!Array.isArray(s.extra)) err("data/sentences.jsonl", line, `"extra" must be array (can be empty)`);
}

// --- exercises ---
const exercises = parseJSONLFile("data/exercises.jsonl");
const seenExId = new Map();
for (const { line, value: ex } of exercises) {
  if (typeof ex !== "object" || ex === null) { err("data/exercises.jsonl", line, "not an object"); continue; }
  for (const k of ["id", "text", "blanks", "questions"]) {
    if (ex[k] === undefined || ex[k] === null) err("data/exercises.jsonl", line, `missing field "${k}"`);
  }
  if (!Array.isArray(ex.blanks) || ex.blanks.length === 0) {
    err("data/exercises.jsonl", line, `"blanks" must be a non-empty array`);
  } else {
    for (const b of ex.blanks) {
      if (typeof b.answer !== "string" || !b.answer.trim()) err("data/exercises.jsonl", line, `blank missing "answer"`);
      if (!Array.isArray(b.options) || b.options.length < 2) err("data/exercises.jsonl", line, `blank missing "options" (need ≥2)`);
    }
  }
  if (!Array.isArray(ex.questions)) {
    err("data/exercises.jsonl", line, `"questions" must be an array`);
  } else {
    for (const q of ex.questions) {
      if (typeof q.question !== "string" || !q.question.trim()) err("data/exercises.jsonl", line, `question missing "question" text`);
      if (!Array.isArray(q.options) || q.options.length < 2) err("data/exercises.jsonl", line, `question missing "options"`);
      if (typeof q.answer !== "number") err("data/exercises.jsonl", line, `question "answer" must be a number (index)`);
    }
  }
  if (ex.id) {
    if (seenExId.has(ex.id)) err("data/exercises.jsonl", line, `duplicate id "${ex.id}" (first at line ${seenExId.get(ex.id)})`);
    else seenExId.set(ex.id, line);
  }
}

if (errors.length) {
  console.error(`✗ ${errors.length} validation error(s):\n`);
  for (const e of errors) console.error("  " + e);
  process.exit(1);
}

console.log(`✓ data/ valid: ${words.length} words, ${verbs.length} verbs, ${sents.length} sentences, ${exercises.length} exercises.`);

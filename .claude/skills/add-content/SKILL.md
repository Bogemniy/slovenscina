---
name: add-content
description: Use when the user shares Slovenian vocabulary in any form to add to the app — pasted word lists, photos of textbook pages, screenshots, free-form text mentioning new words, voice transcripts, "добавь слово/слова/глагол", "ещё несколько". Extracts (sl, ru) pairs from messy input, classifies words vs verbs, assigns categories, dedupes against existing data, and writes to a staging file. Does NOT commit or push — that's the commit-pending skill.
---

# Add content to the staging area

Your job: take whatever the user pastes (image, text, list, anything) and turn it into clean staged entries. **Do not commit. Do not push.** That happens later via the `commit-pending` skill, on explicit user request.

## Files you write to (gitignored, persists across sessions)

- `data/_pending-words.jsonl` — same schema as `data/words.jsonl`: `{"sl":"...","ru":"...","cat":"...","level":1}`
- `data/_pending-verbs.jsonl` — same schema as `data/verbs.jsonl`: `{"inf":"...","ru":"...","forms":{...9 pronouns}}`

Append-only. Same line format as the real files (no extra fields, no whitespace inside the JSON object).

## Files you read

- [data/taxonomy.json](../../../data/taxonomy.json) — for valid categories and pronoun list
- [data/words.jsonl](../../../data/words.jsonl) — for dedup + category examples
- [data/verbs.jsonl](../../../data/verbs.jsonl) — for dedup + conjugation patterns

## Pipeline

### 1. Extract candidate pairs

From whatever the user gave you, pull out pairs of `(slovenian, russian)`:

- **Image / screenshot**: read it via vision. Textbook pages often have a two-column layout — left Slovenian, right Russian (or vice versa). Numbered lists and parenthetical notes are common — strip them.
- **Free text**: tolerate any separator. `hvala = спасибо`, `hvala — спасибо`, `hvala: спасибо`, `hvala (спасибо)`, "слушай, ещё `pijača` — это напиток" all parse to `("hvala", "спасибо")`.
- **One-shot**: a single pair is fine, a hundred is fine. Don't ask the user to reformat.
- **Don't guess pairs you can't read.** If a row in an image is blurry or ambiguous, skip it and report which one(s) you skipped.

### 2. Classify word vs verb

A candidate is a **verb** if its Slovenian side is an infinitive — usually ends in `-ti` or `-či` (e.g. `živeti`, `peči`, `iti`). Reflexive verbs end in `… se` or `… si` (e.g. `umiti se`). Common ambiguous case: a noun like `kuhinja` ends differently — fine, but `kuhati` is a verb. When unsure, ask.

Words go to `_pending-words.jsonl`. Verbs go to `_pending-verbs.jsonl`.

### 3. For words: assign a category

Read the keys of `related` in [data/taxonomy.json](../../../data/taxonomy.json) — that's the closed set of valid categories. **Never invent a new category.** If a word doesn't fit any existing one, ask the user which to use, and offer the closest matches.

Lookup pattern: peek at existing entries in `data/words.jsonl` that share the category to confirm the word "feels right" there. E.g. clothing → `thing`, body parts → `body`, food → `food`, drinks → also `food`.

### 3.5 Assess level

For each word, automatically determine the suggested level:
- level 3 — if `sl` contains a space (phrase or collocation)
- level 1 — if `cat` is `pron` or `question`
- level 2 — everything else

Then ask the user to confirm before writing. If the whole batch is the same level, ask once for the batch:
"Все слова — уровень 2. Верно?"
If there are mixed levels, list them grouped:
"Level 1: jaz, ti, on — верно? Level 2: hiša, miza — верно?"
Wait for confirmation before proceeding to step 4.

### 4. For verbs: produce 9 conjugation forms

The `forms` object **must** have all 9 pronoun keys exactly as listed in `data/taxonomy.json` → `pronouns`:

```
jaz, ti, on/ona/ono, midva/medve, vidva/vedve, onidva/onidve, mi/me, vi/ve, oni/one
```

Apply standard present-tense patterns based on the infinitive ending. Common cases:

- `-ati` regular → `-am, -aš, -a, -ava, -ata, -ata, -amo, -ate, -ajo` (e.g. `delati` → `delam`, …)
- `-iti` / `-eti` regular → `-im, -iš, -i, -iva, -ita, -ita, -imo, -ite, -ijo` (e.g. `živeti` → `živim`, …)
- `-ovati` / `-evati` → `-ujem, -uješ, -uje, -ujeva, -ujeta, -ujeta, -ujemo, -ujete, -ujejo` (e.g. `potovati` → `potujem`, …)
- Reflexive (`… se` / `… si`): every form is prefixed by the clitic. `jaz se umijem`, not `umijem`. Match the clitic that the infinitive carries.
- Irregular verbs (`biti`, `imeti`, `iti`, `vedeti`, `hoteti`, `jesti`, `moči`, `vzeti`, `peči`, `teči`, …): if you're not certain of every form, **ask the user to confirm** before writing. Don't guess.

If a verb has a non-standard negative form (like `biti → nisem`, `imeti → nimam`), ask the user whether to add it to `data/taxonomy.json` → `specialNeg`. That's a separate edit and may be deferred.

### 5. Dedupe

Before staging, check for duplicates against:

1. The real file (`data/words.jsonl` for words, `data/verbs.jsonl` for verbs)
2. The pending file (`data/_pending-words.jsonl` / `data/_pending-verbs.jsonl`)

Match key: `sl` for words, `inf` for verbs. Exact match. If the entry already exists anywhere, skip it and tell the user.

### 6. Write

Use the Edit / Write tools to **append** lines to the appropriate `_pending-*.jsonl` file. Each line is a single compact JSON object. Ensure the file ends with a newline. Create the file if it doesn't exist.

### 7. Report

After processing a batch, summarize what happened:

- Added: N words, M verbs (list briefly: `hvala`, `prosim`, `živeti`, …)
- Skipped duplicates: X (with reason)
- Skipped unparseable: Y (with reason)
- Level distribution: N×1, M×2, K×3
- Anything that needs the user's decision (category choice, irregular verb confirmation)

Don't push. Don't commit. The user knows when to do that.

## What this skill does NOT do

- No `git add`, `git commit`, `git push`. That's `commit-pending`.
- No editing of real `data/words.jsonl` or `data/verbs.jsonl`.
- No new categories in `taxonomy.json` without explicit ask.
- No translations of full sentences — pairs only. (Sentence-builder cards in `data/sentences.jsonl` are out of scope for this skill; those are rare additions, handle them manually if asked.)

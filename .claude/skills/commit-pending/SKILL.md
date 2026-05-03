---
name: commit-pending
description: Use when the user signals they want to push staged content additions to the live app — "давай коммитить", "запушим", "опубликуй слова", "merge pending", or similar. Promotes lines from data/_pending-*.jsonl into the real data files, runs the validator, makes one git commit per batch, and asks for confirmation before pushing.
---

# Commit and push staged content

You are finishing what `add-content` started: take the staged lines, fold them into the real data files, validate, commit, and push (with confirmation).

## Step-by-step

### 1. Read pending state

```
data/_pending-words.jsonl     (may not exist → 0 words)
data/_pending-verbs.jsonl     (may not exist → 0 verbs)
```

If both are missing or empty, tell the user there's nothing staged and stop.

### 2. Show the batch and ask for confirmation

Before any file write or git operation, summarize what's about to be promoted:

```
Сейчас в стейджинге:
  • N слов: hvala, prosim, dober dan, …
  • M глаголов: živeti, peči, …

Промоутим в data/words.jsonl и data/verbs.jsonl?
```

Wait for explicit yes. Treat ambiguous responses as "no, ask again". If the user wants to drop something from the batch, edit the pending file accordingly and re-summarize.

### 3. Promote (append to real files)

For each pending file with content:

1. Note the current line count of the real file (you'll need it if validation fails).
2. Append the pending file's content verbatim to the real file. Use `cat` via Bash:
   ```bash
   cat data/_pending-words.jsonl >> data/words.jsonl
   cat data/_pending-verbs.jsonl >> data/verbs.jsonl
   ```
   (Skip whichever pending file is empty or absent.)
3. Ensure both real files still end with exactly one newline.

### 4. Validate

```bash
node scripts/validate-data.mjs
```

If validation fails:

1. Roll back the appends. The cleanest way: truncate the real files back to the line counts you noted in step 3.1. Use `head -n <count> file > file.tmp && mv file.tmp file` or `sed -i '' "$((count+1)),\$d" file` (macOS).
2. Show the validator error to the user.
3. Tell them the pending file is unchanged; they can fix and try again.
4. **Do not commit.**

### 5. Commit

If validation passes:

```bash
git add data/words.jsonl data/verbs.jsonl
```

Compose a commit message that summarizes the batch. Keep it short, factual, and follow the existing repo style (see `git log -5`):

```
add: 6 слов (greet, food) + 2 глагола

slova: hvala, prosim, voda, sok, kruh, kava
glagoli: piti, jesti
```

If the batch is small (≤3 entries total), one-line message is fine:

```
add: hvala, prosim — спасибо, пожалуйста
```

Commit:

```bash
git commit -m "$(cat <<'EOF'
<message>

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

### 6. Truncate the pending files

After successful commit:

```bash
> data/_pending-words.jsonl
> data/_pending-verbs.jsonl
```

(Leave the files in place but empty. Next `add-content` invocation will append into them.)

### 7. Ask before pushing

**Critical: never push without explicit confirmation.** Show:

```
Закоммитила локально. Текущая ветка: <branch>. Пушим origin/<branch>?
```

Wait for yes. Then:

```bash
git push
```

If push rejects (remote ahead):

```bash
git pull --rebase
git push
```

Re-run validation after rebase if there were upstream `data/` changes — paranoid, takes a second, worth it.

### 8. Confirm to user

Report: how many entries went live, current totals (`words: NNN, verbs: NN` from the validator output), and that GitHub Pages will deploy automatically within ~1 minute.

## Edge cases

- **User wants to push without going through staging** ("просто закоммить и запушь"): refuse politely, point at `add-content`. The staging file is the audit trail — bypassing it loses that.
- **Pending file has invalid JSON** (corrupted somehow): tell the user, show the bad line, ask whether to drop it or fix it. Don't promote.
- **Real file changed upstream during the session**: `git pull --rebase` before promoting. If conflicts in `data/*.jsonl`, that means two append-only batches collided — which shouldn't happen since each side only adds new lines. If it does happen, the resolution is `git checkout --theirs` (keep upstream), then re-run `commit-pending` to re-append the local pending lines on top.
- **User says "отмени, не пушим"**: leave the local commit in place but do NOT push. Tell them they can `git reset --hard HEAD~1` if they want it gone, or just leave it for next time.

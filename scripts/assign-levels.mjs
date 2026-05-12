import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function processWords() {
  const path = join(root, "data/words.jsonl");
  const lines = readFileSync(path, "utf8").trimEnd().split("\n");
  const out = lines.map((line) => {
    const obj = JSON.parse(line);
    let level;
    if (obj.sl.includes(" ")) level = 3;
    else if (obj.cat === "pron" || obj.cat === "question") level = 1;
    else level = 2;
    return JSON.stringify({ ...obj, level });
  });
  writeFileSync(path, out.join("\n") + "\n");
  console.log(`words.jsonl: ${out.length} lines updated`);
}

function processExercises() {
  const path = join(root, "data/exercises.jsonl");
  const lines = readFileSync(path, "utf8").trimEnd().split("\n");
  const out = lines.map((line) => {
    const obj = JSON.parse(line);
    const n = obj.blanks.length;
    let level;
    if (n <= 6) level = "A2.1";
    else if (n <= 10) level = "A2.2";
    else level = "A2.3";
    return JSON.stringify({ ...obj, level });
  });
  writeFileSync(path, out.join("\n") + "\n");
  console.log(`exercises.jsonl: ${out.length} lines updated`);
}

function processLearn() {
  const path = join(root, "data/learn.jsonl");
  const lines = readFileSync(path, "utf8").trimEnd().split("\n");
  const out = lines.map((line) => {
    const obj = JSON.parse(line);
    let level;
    if (obj.sl.includes(" ")) level = 3;
    else if (obj.cat === "pron" || obj.cat === "question") level = 1;
    else level = 2;
    return JSON.stringify({ ...obj, level });
  });
  writeFileSync(path, out.join("\n") + "\n");
  console.log(`learn.jsonl: ${out.length} lines updated`);
}

processWords();
processExercises();
processLearn();

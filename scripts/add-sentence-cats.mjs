import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const CATS = [
  ["greet"],
  ["greet", "phrase"],
  ["greet"],
  ["greet", "phrase"],
  ["food"],
  ["weather", "season"],
  ["family"],
  ["phrase"],
  ["info", "place"],
  ["goplace", "job"],
  ["goplace", "activity"],
  ["goplace", "body"],
  ["daily", "food"],
  ["daily", "activity"],
  ["weather", "season"],
  ["where", "phrase"],
  ["time"],
  ["goplace", "daily"],
  ["thing"],
  ["greet", "phrase"],
  ["daily", "food", "time"],
  ["info", "phrase"],
  ["daily", "activity"],
  ["daily", "activity"],
  ["daily", "time"],
  ["daily", "food"],
  ["daily"],
  ["job", "where"],
  ["activity", "transport"],
  ["activity", "place"],
  ["phrase", "info"],
  ["food"],
  ["job", "time"],
  ["daily", "time"],
  ["school", "info"],
  ["activity", "season"],
  ["goplace", "activity"],
  ["school", "time"],
  ["food", "goplace"],
  ["job", "time"],
];

const path = join(root, "data/sentences.jsonl");
const lines = readFileSync(path, "utf8").trimEnd().split("\n");
const out = lines.map((line, i) => {
  const obj = JSON.parse(line);
  if (i >= CATS.length) { console.warn(`WARNING: no cats for line ${i}`); return line; }
  return JSON.stringify({ ...obj, cats: CATS[i] });
});
writeFileSync(path, out.join("\n") + "\n");
console.log(`sentences.jsonl: ${out.length} lines updated`);

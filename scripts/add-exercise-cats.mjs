import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const TOPIC_TO_CATS = {
  "Mesto, stanovanje": ["where", "home", "goplace", "place"],
  "Mesto, všeč mi je": ["where", "home", "place", "adj"],
  "Predstavljanje, socialni stiki": ["greet", "info", "pron", "people"],
  "Vabila, socialni stiki": ["greet", "phrase", "adj"],
  "Družina, poklici": ["family", "job", "people"],
  "Družina, poroka": ["family", "people"],
  "Hrana in pijača, naročanje": ["food", "shop"],
  "Vsakodnevne aktivnosti, čas": ["daily", "time", "verb"],
  "Vsakodnevne aktivnosti": ["daily", "verb"],
  "Vreme": ["weather", "season"],
  "Urnik, poklici, šport": ["time", "job", "sport"],
  "Urnik, poklici": ["time", "job"],
  "Poklici, delo": ["job", "thing"],
  "Delo, poklici": ["job", "thing"],
  "Delo, vsakodnevne aktivnosti": ["job", "daily", "verb"],
  "Delo, socialni stiki, vsakodnevno življenje": ["job", "daily", "greet"],
  "Stanovanje, dom": ["home", "where"],
  "Prosti čas, šport, narava": ["activity", "sport", "verb"],
  "Prosti čas, narava, prijatelji": ["activity", "people", "verb"],
  "Prosti čas, kino, vabila": ["activity", "greet", "phrase"],
};

const path = join(root, "data/exercises.jsonl");
const lines = readFileSync(path, "utf8").trimEnd().split("\n");
const out = lines.map((line) => {
  const obj = JSON.parse(line);
  const cats = TOPIC_TO_CATS[obj.topic];
  if (!cats) console.warn(`WARNING: no cats for topic "${obj.topic}" (id=${obj.id})`);
  return JSON.stringify({ ...obj, cats: cats || [] });
});
writeFileSync(path, out.join("\n") + "\n");
console.log(`exercises.jsonl: ${out.length} lines updated`);

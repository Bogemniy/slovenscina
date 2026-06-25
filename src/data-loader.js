import { DATA_FILES, CACHE_KEYS } from "./config.js";

const parseJSONL = (text) =>
  text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l, i) => {
      try { return JSON.parse(l); }
      catch (e) { throw new Error(`JSONL parse error at line ${i + 1}: ${e.message}`); }
    });

async function fetchAndCache(url, cacheKey, parse) {
  try {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const parsed = parse(text);
    try { localStorage.setItem(cacheKey, JSON.stringify({ at: Date.now(), parsed })); } catch {}
    return parsed;
  } catch (netErr) {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try { return JSON.parse(cached).parsed; } catch {}
    }
    throw netErr;
  }
}

export async function loadAllData() {
  const [words, verbs, sentences, taxonomy, learn, exercises, grammar] = await Promise.all([
    fetchAndCache(DATA_FILES.words, CACHE_KEYS.words, parseJSONL),
    fetchAndCache(DATA_FILES.verbs, CACHE_KEYS.verbs, parseJSONL),
    fetchAndCache(DATA_FILES.sentences, CACHE_KEYS.sentences, parseJSONL),
    fetchAndCache(DATA_FILES.taxonomy, CACHE_KEYS.taxonomy, JSON.parse),
    fetchAndCache(DATA_FILES.learn, CACHE_KEYS.learn, parseJSONL),
    fetchAndCache(DATA_FILES.exercises, CACHE_KEYS.exercises, parseJSONL),
    fetchAndCache(DATA_FILES.grammar, CACHE_KEYS.grammar, parseJSONL),
  ]);

  const CAT_MAP = {}, CAT_MAP_SL = {};
  for (const w of words) {
    if (!CAT_MAP[w.cat]) CAT_MAP[w.cat] = [];
    if (!CAT_MAP_SL[w.cat]) CAT_MAP_SL[w.cat] = [];
    CAT_MAP[w.cat].push(w.ru);
    CAT_MAP_SL[w.cat].push(w.sl);
  }

  const LEARN_CAT_MAP = {}, LEARN_CAT_MAP_SL = {};
  for (const w of learn) {
    if (!LEARN_CAT_MAP[w.cat]) LEARN_CAT_MAP[w.cat] = [];
    if (!LEARN_CAT_MAP_SL[w.cat]) LEARN_CAT_MAP_SL[w.cat] = [];
    LEARN_CAT_MAP[w.cat].push(w.ru);
    LEARN_CAT_MAP_SL[w.cat].push(w.sl);
  }

  return {
    WORDS: words,
    VERBS: verbs,
    SENTENCES: sentences,
    PRONOUNS: taxonomy.pronouns,
    PRONOUN_SHORT: taxonomy.pronounShort,
    SPECIAL_NEG: taxonomy.specialNeg,
    RELATED: taxonomy.related,
    CAT_MAP,
    CAT_MAP_SL,
    LEARN: learn,
    LEARN_CAT_MAP,
    LEARN_CAT_MAP_SL,
    EXERCISES: exercises,
    GRAMMAR: grammar,
  };
}

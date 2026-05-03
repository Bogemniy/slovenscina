import { state, shuffle, bucketWords, getWP, saveQueue } from "../state.js";

function genWordOptions(w, dir) {
  const isSl = dir === "sl2ru";
  const correct = isSl ? w.ru : w.sl;
  const MAP = isSl ? state.CAT_MAP : state.CAT_MAP_SL;
  let pool = (MAP[w.cat] || []).filter((x) => x !== correct);
  if (pool.length < 4) {
    const rel = state.RELATED[w.cat] || [];
    for (const rc of rel) pool = [...pool, ...(MAP[rc] || []).filter((x) => x !== correct && !pool.includes(x))];
  }
  return shuffle([correct, ...shuffle(pool).slice(0, 2)]);
}

function findContextSentence(w) {
  const target = w.sl.toLowerCase();
  if (target.indexOf(" ") >= 0) return null;
  for (const s of shuffle([...state.SENTENCES])) {
    const tokens = s.sl.join(" ").toLowerCase().match(/[a-zčšžć]+/gi) || [];
    if (tokens.includes(target)) {
      const original = s.sl.join(" ");
      const re = new RegExp("\\b" + w.sl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i");
      const blanked = original.replace(re, "___");
      return { sentence: blanked, ru: s.ru };
    }
  }
  return null;
}

export function genWordQuiz(n = 10, mode = "all") {
  let picked = [];
  const buckets = bucketWords();
  if (mode === "new") {
    if (buckets.new.length === 0) return [];
    picked = shuffle(buckets.new).slice(0, n);
  } else if (mode === "review") {
    if (buckets.due.length === 0 && buckets.learning.length === 0) return [];
    const dueSorted = [...buckets.due].sort((a, b) => (getWP(b.sl).mistakes || 0) - (getWP(a.sl).mistakes || 0));
    const nDue = Math.ceil(n * 0.7);
    const nMistakes = Math.floor(n * 0.2);
    const duePart = dueSorted.slice(0, nDue);
    const dueSls = new Set(duePart.map((w) => w.sl));
    const mistakePool = [...buckets.due, ...buckets.learning]
      .filter((w) => !dueSls.has(w.sl) && (getWP(w.sl).mistakes || 0) > 0)
      .sort((a, b) => (getWP(b.sl).mistakes || 0) - (getWP(a.sl).mistakes || 0));
    const mistakePart = mistakePool.slice(0, nMistakes);
    picked = [...duePart, ...mistakePart];
    if (picked.length < n) {
      const usedSls = new Set(picked.map((w) => w.sl));
      const fillPool = shuffle([...buckets.due, ...buckets.learning].filter((w) => !usedSls.has(w.sl)));
      picked = [...picked, ...fillPool.slice(0, n - picked.length)];
    }
    picked = shuffle(picked);
  } else {
    if (state.wordQueue.length < n) {
      state.wordQueue = shuffle([...state.WORDS]);
      state.wordsSeen = 0;
    }
    picked = state.wordQueue.splice(0, n);
    state.wordsSeen += picked.length;
    saveQueue("wq", state.wordQueue, state.wordsSeen);
  }
  return picked.map((w, i) => {
    const dir = i % 2 === 0 ? "sl2ru" : "ru2sl";
    const card = { ...w, dir, options: genWordOptions(w, dir) };
    const p = state.wordProgress[w.sl];
    if (p && p.level >= 4 && Math.random() < 0.3) {
      const ctx = findContextSentence(w);
      if (ctx) card.context = ctx;
    }
    return card;
  });
}

export { genWordOptions };

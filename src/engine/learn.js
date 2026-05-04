import { state, shuffle, bucketLearn, getLP, saveLearnQueue } from "../state.js";

function genLearnOptions(w, dir) {
  const isSl = dir === "sl2ru";
  const correct = isSl ? w.ru : w.sl;
  const MAP = isSl ? state.LEARN_CAT_MAP : state.LEARN_CAT_MAP_SL;
  let pool = (MAP[w.cat] || []).filter((x) => x !== correct);
  if (pool.length < 3) {
    const allRu = state.LEARN.map((x) => (isSl ? x.ru : x.sl)).filter((x) => x !== correct && !pool.includes(x));
    pool = [...pool, ...shuffle(allRu).slice(0, 3 - pool.length)];
  }
  return shuffle([correct, ...shuffle(pool).slice(0, 2)]);
}

export function genLearnQuiz(n = 10, mode = "all") {
  let picked = [];
  const buckets = bucketLearn();
  if (mode === "new") {
    if (buckets.new.length === 0) return [];
    picked = shuffle(buckets.new).slice(0, n);
  } else if (mode === "review") {
    if (buckets.due.length === 0 && buckets.learning.length === 0) return [];
    const dueSorted = [...buckets.due].sort((a, b) => (getLP(b.sl).mistakes || 0) - (getLP(a.sl).mistakes || 0));
    const nDue = Math.ceil(n * 0.7);
    const duePart = dueSorted.slice(0, nDue);
    const dueSls = new Set(duePart.map((w) => w.sl));
    const fillPool = shuffle([...buckets.due, ...buckets.learning].filter((w) => !dueSls.has(w.sl)));
    picked = shuffle([...duePart, ...fillPool.slice(0, n - duePart.length)]);
  } else {
    if (state.learnQueue.length < n) {
      state.learnQueue = shuffle([...state.LEARN]);
      state.learnSeen = 0;
    }
    picked = state.learnQueue.splice(0, n);
    state.learnSeen += picked.length;
    saveLearnQueue();
  }
  return picked.map((w, i) => {
    const dir = i % 2 === 0 ? "sl2ru" : "ru2sl";
    return { ...w, dir, options: genLearnOptions(w, dir) };
  });
}

export { genLearnOptions };

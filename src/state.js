// Mutable global state — populated by main.js after data load.
export const state = {
  WORDS: [], VERBS: [], SENTENCES: [], LEARN: [], GRAMMAR: [], NOUNS: [],
  PRONOUNS: [], PRONOUN_SHORT: {}, SPECIAL_NEG: {}, RELATED: {},
  CAT_MAP: {}, CAT_MAP_SL: {},
  LEARN_CAT_MAP: {}, LEARN_CAT_MAP_SL: {},
  wordProgress: {},
  wordQueue: [], wordsSeen: 0,
  verbQueue: [], verbsSeen: 0,
  learnProgress: {},
  learnQueue: [], learnSeen: 0,
  sentQueue: [],
  ui: { mode: "menu" },
};

export function shuffle(a) {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

// Spaced repetition intervals (level → ms until next review).
//  0: same round, 1: 10min, 2: 1day, 3: 3days, 4: 7days, 5: 30days
export const SR_INTERVALS = [
  0,
  10 * 60 * 1000,
  24 * 3600 * 1000,
  3 * 24 * 3600 * 1000,
  7 * 24 * 3600 * 1000,
  30 * 24 * 3600 * 1000,
];

export function loadWordProgress() {
  try {
    const d = JSON.parse(localStorage.getItem("wp"));
    if (d && typeof d === "object") state.wordProgress = d;
  } catch {}
}

export function saveWordProgress() {
  try { localStorage.setItem("wp", JSON.stringify(state.wordProgress)); } catch {}
}

export function getWP(sl) {
  if (!state.wordProgress[sl]) {
    state.wordProgress[sl] = { level: 0, nextDue: 0, mistakes: 0, mastered: false, lastSeen: 0, streak: 0 };
  }
  return state.wordProgress[sl];
}

export function updateWP(sl, correct) {
  const p = getWP(sl);
  p.lastSeen = Date.now();
  if (correct) {
    p.streak = (p.streak || 0) + 1;
    p.level = Math.min(5, p.level + 1);
    if (p.level >= 5 && p.streak >= 3) p.mastered = true;
  } else {
    p.streak = 0;
    p.level = 0;
    p.mistakes = (p.mistakes || 0) + 1;
    p.mastered = false;
  }
  p.nextDue = Date.now() + SR_INTERVALS[p.level];
  saveWordProgress();
}

export function unmasterWord(sl) {
  const p = getWP(sl);
  p.mastered = false;
  p.level = Math.max(0, p.level - 2);
  p.streak = 0;
  p.nextDue = Date.now();
  saveWordProgress();
}

export function bucketWords() {
  const now = Date.now();
  const buckets = { new: [], due: [], learning: [], mastered: [] };
  for (const w of state.WORDS) {
    const p = state.wordProgress[w.sl];
    if (!p || p.lastSeen === 0) { buckets.new.push(w); continue; }
    if (p.mastered) { buckets.mastered.push(w); continue; }
    if (p.nextDue <= now) { buckets.due.push(w); continue; }
    buckets.learning.push(w);
  }
  return buckets;
}

export function saveQueue(key, queue, seen) {
  try {
    const data = queue.map((w) => (w.verb ? w.verb.inf + "|" + w.pronoun : w.sl));
    let seen_list;
    if (key === "wq") {
      const qSet = new Set(data);
      seen_list = state.WORDS.filter((w) => !qSet.has(w.sl)).map((w) => w.sl);
    } else {
      const qSet = new Set(data);
      seen_list = [];
      for (const v of state.VERBS) {
        for (const p of state.PRONOUNS) {
          const k = v.inf + "|" + p;
          if (!qSet.has(k)) seen_list.push(k);
        }
      }
    }
    localStorage.setItem(
      key,
      JSON.stringify({
        queue: data,
        seen,
        seen_list,
        total: key === "wq" ? state.WORDS.length : state.VERBS.length * 9,
      })
    );
  } catch {}
}

export function loadWordQueue() {
  try {
    const d = JSON.parse(localStorage.getItem("wq"));
    if (d && d.queue && d.queue.length > 0) {
      const restored = d.queue.map((sl) => state.WORDS.find((w) => w.sl === sl)).filter(Boolean);
      const queueSls = new Set(d.queue);
      const newWords = state.WORDS.filter(
        (w) => !queueSls.has(w.sl) && !d.seen_list?.includes(w.sl)
      );
      state.wordQueue = [...restored, ...shuffle(newWords)];
      state.wordsSeen = d.seen || 0;
      return;
    }
  } catch {}
  state.wordQueue = shuffle([...state.WORDS]);
  state.wordsSeen = 0;
}

export function loadVerbQueue() {
  try {
    const d = JSON.parse(localStorage.getItem("vq"));
    if (d && d.queue && d.queue.length > 0) {
      const restored = d.queue
        .map((k) => {
          const [inf, p] = k.split("|");
          const v = state.VERBS.find((x) => x.inf === inf);
          return v && p ? { verb: v, pronoun: p } : null;
        })
        .filter(Boolean);
      const queueKeys = new Set(d.queue);
      const allCombos = [];
      for (const v of state.VERBS) for (const p of state.PRONOUNS) allCombos.push({ verb: v, pronoun: p });
      const newCombos = allCombos.filter((c) => {
        const k = c.verb.inf + "|" + c.pronoun;
        return !queueKeys.has(k) && !d.seen_list?.includes(k);
      });
      state.verbQueue = [...restored, ...shuffle(newCombos)];
      state.verbsSeen = d.seen || 0;
      return;
    }
  } catch {}
  const combos = [];
  for (const v of state.VERBS) for (const p of state.PRONOUNS) combos.push({ verb: v, pronoun: p });
  state.verbQueue = shuffle(combos);
  state.verbsSeen = 0;
}

export function loadLearnProgress() {
  try {
    const d = JSON.parse(localStorage.getItem("lp"));
    if (d && typeof d === "object") state.learnProgress = d;
  } catch {}
}

export function saveLearnProgress() {
  try { localStorage.setItem("lp", JSON.stringify(state.learnProgress)); } catch {}
}

export function getLP(sl) {
  if (!state.learnProgress[sl]) {
    state.learnProgress[sl] = { level: 0, nextDue: 0, mistakes: 0, mastered: false, lastSeen: 0, streak: 0 };
  }
  return state.learnProgress[sl];
}

export function updateLP(sl, correct) {
  const p = getLP(sl);
  p.lastSeen = Date.now();
  if (correct) {
    p.streak = (p.streak || 0) + 1;
    p.level = Math.min(5, p.level + 1);
    if (p.level >= 5 && p.streak >= 3) p.mastered = true;
  } else {
    p.streak = 0;
    p.level = 0;
    p.mistakes = (p.mistakes || 0) + 1;
    p.mastered = false;
  }
  p.nextDue = Date.now() + SR_INTERVALS[p.level];
  saveLearnProgress();
}

export function bucketLearn() {
  const now = Date.now();
  const buckets = { new: [], due: [], learning: [], mastered: [] };
  for (const w of state.LEARN) {
    const p = state.learnProgress[w.sl];
    if (!p || p.lastSeen === 0) { buckets.new.push(w); continue; }
    if (p.mastered) { buckets.mastered.push(w); continue; }
    if (p.nextDue <= now) { buckets.due.push(w); continue; }
    buckets.learning.push(w);
  }
  return buckets;
}

export function loadLearnQueue() {
  try {
    const d = JSON.parse(localStorage.getItem("lq"));
    if (d && d.queue && d.queue.length > 0) {
      const restored = d.queue.map((sl) => state.LEARN.find((w) => w.sl === sl)).filter(Boolean);
      const queueSls = new Set(d.queue);
      const newWords = state.LEARN.filter(
        (w) => !queueSls.has(w.sl) && !d.seen_list?.includes(w.sl)
      );
      state.learnQueue = [...restored, ...shuffle(newWords)];
      state.learnSeen = d.seen || 0;
      return;
    }
  } catch {}
  state.learnQueue = shuffle([...state.LEARN]);
  state.learnSeen = 0;
}

export function saveLearnQueue() {
  try {
    const data = state.learnQueue.map((w) => w.sl);
    const qSet = new Set(data);
    const seen_list = state.LEARN.filter((w) => !qSet.has(w.sl)).map((w) => w.sl);
    localStorage.setItem("lq", JSON.stringify({ queue: data, seen: state.learnSeen, seen_list, total: state.LEARN.length }));
  } catch {}
}

export function getNegForm(v, p) {
  if (state.SPECIAL_NEG[v.inf]) return state.SPECIAL_NEG[v.inf][p];
  return "ne " + v.forms[p];
}

import { state, shuffle, saveQueue, getNegForm } from "../state.js";

function genVerbOptions(v, p, neg) {
  const getF = (vv, pp) => (neg ? getNegForm(vv, pp) : vv.forms[pp]);
  const correct = getF(v, p);
  const others = state.PRONOUNS.filter((x) => x !== p).map((x) => getF(v, x)).filter((x) => x !== correct);
  return shuffle([correct, ...shuffle([...new Set(others)]).slice(0, 2)]);
}

export function genVerbPastOptions(v, p) {
  const correct = v.past[p];
  const others = state.PRONOUNS.filter((x) => x !== p).map((x) => v.past[x]).filter((x) => x !== correct);
  return shuffle([correct, ...shuffle([...new Set(others)]).slice(0, 2)]);
}

export function genVerbPastQuiz(n = 10, level = 0) {
  const allVerbs = level === 0 ? state.VERBS : state.VERBS.filter((v) => v.level === level);
  const pool = allVerbs.filter((v) => v.past);
  const combos = [];
  for (const v of pool) for (const p of state.PRONOUNS) combos.push({ verb: v, pronoun: p });
  const picked = shuffle(combos).slice(0, n);
  const reordered = [];
  const rem = [...picked];
  while (rem.length > 0) {
    const last = reordered.length ? reordered[reordered.length - 1].pronoun : null;
    const idx = rem.findIndex((q) => q.pronoun !== last);
    reordered.push(idx >= 0 ? rem.splice(idx, 1)[0] : rem.shift());
  }
  return reordered.map((q) => ({ ...q, negative: false, options: genVerbPastOptions(q.verb, q.pronoun) }));
}

export function genVerbQuiz(n = 10, level = 0) {
  const pool = level === 0 ? state.VERBS : state.VERBS.filter((v) => v.level === level);
  if (state.verbQueue.length < n) {
    const combos = [];
    for (const v of pool) for (const p of state.PRONOUNS) combos.push({ verb: v, pronoun: p });
    state.verbQueue = shuffle(combos);
    state.verbsSeen = 0;
  }
  const picked = state.verbQueue.splice(0, n);
  state.verbsSeen += picked.length;
  saveQueue(
    "vq",
    state.verbQueue.map((q) => ({ sl: null, verb: q.verb, pronoun: q.pronoun })),
    state.verbsSeen
  );

  // Reorder: avoid two consecutive items with the same pronoun.
  const reordered = [];
  const rem = [...picked];
  while (rem.length > 0) {
    const last = reordered.length ? reordered[reordered.length - 1].pronoun : null;
    const idx = rem.findIndex((q) => q.pronoun !== last);
    reordered.push(idx >= 0 ? rem.splice(idx, 1)[0] : rem.shift());
  }
  return reordered.map((q, i) => {
    const neg = i % 3 === 0;
    return { ...q, negative: neg, options: genVerbOptions(q.verb, q.pronoun, neg) };
  });
}

export { genVerbOptions };


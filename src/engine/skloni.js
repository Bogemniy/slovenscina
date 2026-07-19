import { shuffle } from "../state.js";

const QUIZ_CASES = ["rod", "daj", "tož", "mest", "or"];
const ALL_NUMBERS = ["ednina", "dvojina", "množina"];
const ALL_CASES = ["im", "rod", "daj", "tož", "mest", "or"];

export const CASE_LABELS = {
  rod:  { sl: "Rodilnik",  ru: "кого? чего?" },
  daj:  { sl: "Dajalnik",  ru: "кому? чему?" },
  tož:  { sl: "Tožilnik",  ru: "кого? что?" },
  mest: { sl: "Mestnik",   ru: "o ком? o чём?" },
  or:   { sl: "Orodnik",   ru: "кем? чем?" },
};

export const NUM_LABELS = {
  ednina:  { sl: "ednina",  ru: "ед.ч." },
  dvojina: { sl: "dvojina", ru: "дв.ч." },
  množina: { sl: "množina", ru: "мн.ч." },
};

function genQuestion(nouns) {
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const availableNums = noun.samo_mn ? ["množina"] : ALL_NUMBERS;
  const num = availableNums[Math.floor(Math.random() * availableNums.length)];
  const cas = QUIZ_CASES[Math.floor(Math.random() * QUIZ_CASES.length)];
  const correct = noun.sklon[num][cas];

  // Pool of distractor forms: for samo_mn only množina, otherwise all 18 forms
  const pool = [];
  for (const n of availableNums) {
    for (const c of ALL_CASES) {
      pool.push(noun.sklon[n][c]);
    }
  }
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // Pick up to 3 unique distractors (different string value from correct)
  const seen = new Set([correct]);
  const distractors = [];
  for (const form of pool) {
    if (!seen.has(form)) {
      seen.add(form);
      distractors.push(form);
      if (distractors.length === 3) break;
    }
  }

  return { noun, num, cas, correct, options: shuffle([correct, ...distractors]) };
}

export function genSkloniSession(nouns, count = 10) {
  return Array.from({ length: count }, () => genQuestion(nouns));
}

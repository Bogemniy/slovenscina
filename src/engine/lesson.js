import { state, shuffle } from "../state.js";

export function genLesson() {
  const allSents = state.SENTENCES;
  const cats = [...new Set(allSents.flatMap(s => s.cats || []))];
  const cat = cats[Math.floor(Math.random() * cats.length)];

  const catSents = shuffle(allSents.filter(s => (s.cats || []).includes(cat)));
  const otherSents = shuffle(allSents.filter(s => !(s.cats || []).includes(cat)));
  const picked = shuffle([...catSents, ...otherSents].slice(0, 10));

  const cards = picked.map(s => ({
    type: "tiles",
    sl: s.sl,
    ru: s.ru,
    tiles: shuffle([...s.sl, ...(s.extra || [])]),
    answer: [],
    checked: false,
    correct: false,
  }));

  return { cat, cards };
}

import { state, shuffle } from "../state.js";
import { genLearnOptions } from "./learn.js";

export function genLesson() {
  // Найти категории где есть и слова и предложения
  const wordCats = new Set(state.LEARN.map(w => w.cat));
  const sentCats = new Set(state.SENTENCES.flatMap(s => s.cats || []));
  const available = [...wordCats].filter(c => sentCats.has(c));

  // Выбрать случайную категорию
  const cat = available[Math.floor(Math.random() * available.length)];

  // Взять 3 слова из категории
  const catWords = shuffle(state.LEARN.filter(w => w.cat === cat)).slice(0, 3);

  // Взять 2-3 предложения из категории
  const catSents = shuffle(state.SENTENCES.filter(s => (s.cats || []).includes(cat))).slice(0, 3);

  // Взять 2 случайных слова из других категорий
  const otherWords = shuffle(state.LEARN.filter(w => w.cat !== cat)).slice(0, 2);

  const cards = [];

  // 1. Слова → выбор из вариантов
  catWords.forEach(w => {
    cards.push({
      type: "choice",
      sl: w.sl,
      ru: w.ru,
      cat: w.cat,
      options: genLearnOptions(w, "ru2sl"),
      dir: "ru2sl",
    });
  });

  // 2. Те же слова → ввод текста
  catWords.forEach(w => {
    cards.push({
      type: "input",
      sl: w.sl,
      ru: w.ru,
    });
  });

  // 3. Предложения → плитки
  catSents.forEach(s => {
    const allTiles = shuffle([...s.sl, ...s.extra]);
    cards.push({
      type: "tiles",
      sl: s.sl,
      ru: s.ru,
      tiles: allTiles,
      answer: [],
      checked: false,
    });
  });

  // 4. Случайные слова → выбор
  otherWords.forEach(w => {
    cards.push({
      type: "choice",
      sl: w.sl,
      ru: w.ru,
      cat: w.cat,
      options: genLearnOptions(w, "ru2sl"),
      dir: "ru2sl",
    });
  });

  return { cat, cards };
}

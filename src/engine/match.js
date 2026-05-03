import { state, shuffle } from "../state.js";

export function genMatchRound() {
  if (state.matchQueue.length < 5) state.matchQueue = shuffle([...state.WORDS]);
  const picked = state.matchQueue.splice(0, 5);
  return {
    pairs: picked.map((w) => ({ sl: w.sl, ru: w.ru, matched: false })),
    slOrder: shuffle([0, 1, 2, 3, 4]),
    ruOrder: shuffle([0, 1, 2, 3, 4]),
    selectedSl: null,
    selectedRu: null,
    wrongPair: null,
    mistakes: 0,
  };
}

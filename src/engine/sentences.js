import { state, shuffle } from "../state.js";

export function genSentQuiz(n = 8) {
  if (state.sentQueue.length < n) state.sentQueue = shuffle([...state.SENTENCES]);
  return state.sentQueue.splice(0, n).map((s) => {
    const tiles = shuffle([...s.sl, ...s.extra]);
    return { ...s, tiles, answer: [], checked: false, correct: false };
  });
}

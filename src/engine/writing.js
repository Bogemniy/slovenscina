import { state, shuffle, saveLearnQueue } from "../state.js";

export function genWritingQuiz(n = 10) {
  if (state.learnQueue.length < n) {
    state.learnQueue = shuffle([...state.LEARN]);
    state.learnSeen = 0;
  }
  const picked = state.learnQueue.splice(0, n);
  state.learnSeen += picked.length;
  saveLearnQueue();
  return picked.map((w) => ({ ...w }));
}

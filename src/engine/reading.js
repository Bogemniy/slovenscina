import { state } from "../state.js";

export function getExercise(idx) {
  const n = state.EXERCISES.length;
  if (n === 0) return null;
  return state.EXERCISES[((idx % n) + n) % n];
}

export function getExerciseCount() {
  return state.EXERCISES.length;
}

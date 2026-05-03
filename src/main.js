import { loadAllData } from "./data-loader.js";
import { state, loadWordProgress, loadWordQueue, loadVerbQueue } from "./state.js";

import { renderMenu, goMenu, resetProgress, exportProgress, importProgress } from "./ui/menu.js";
import {
  startWords, renderWordsMenu, startWordsMode, renderWordsQuiz,
  selfAnswer, advanceWord, selectWord, renderWordsResult,
  retryWordMistakes, showMasteredList, unmasterAndRefresh,
} from "./ui/words.js";
import {
  startVerbs, renderVerbsQuiz, selectVerb, renderVerbsResult,
  retryVerbMistakes, showVerbList, showVerbTable,
} from "./ui/verbs.js";
import { startMatch, renderMatch, pickSl, pickRu, nextMatchRound } from "./ui/match.js";
import {
  startSents, renderSentQuiz, addTile, removeTile, checkSent, nextSent,
} from "./ui/sentences.js";

import { initFirebase, fbSignIn, fbSignOut } from "./firebase-sync.js";

async function bootstrap() {
  // 1. Load data (network → fallback to localStorage cache)
  let data;
  try {
    data = await loadAllData();
  } catch (e) {
    document.getElementById("app").innerHTML =
      `<div style="padding:40px;text-align:center;color:#ff6b6b">Не удалось загрузить данные.<br><br><span style="color:#5a7a94;font-size:13px">${e.message}</span></div>`;
    return;
  }
  Object.assign(state, data);

  // 2. Hydrate progress and queues from localStorage
  loadWordProgress();
  loadWordQueue();
  loadVerbQueue();

  // 3. Expose every onclick handler on window — preserves the legacy template style.
  Object.assign(window, {
    // menu
    renderMenu, goMenu, resetProgress, exportProgress, importProgress,
    // words
    startWords, renderWordsMenu, startWordsMode, renderWordsQuiz,
    selfAnswer, advanceWord, selectWord, renderWordsResult,
    retryWordMistakes, showMasteredList, unmasterAndRefresh,
    // verbs
    startVerbs, renderVerbsQuiz, selectVerb, renderVerbsResult,
    retryVerbMistakes, showVerbList, showVerbTable,
    // match
    startMatch, renderMatch, pickSl, pickRu, nextMatchRound,
    // sentences
    startSents, renderSentQuiz, addTile, removeTile, checkSent, nextSent,
    // firebase
    fbSignIn, fbSignOut,
  });

  // 4. Render initial screen
  renderMenu();

  // 5. Wire up cloud sync (auth state listener + auth bar)
  initFirebase();

  // 6. Register service worker for offline support
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch((e) => console.warn("SW registration failed:", e));
  }
}

bootstrap();

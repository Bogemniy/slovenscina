import { loadAllData } from "./data-loader.js";
import { state, loadWordProgress, loadWordQueue, loadVerbQueue, loadLearnProgress, loadLearnQueue } from "./state.js";

import { renderMenu, goMenu, resetProgress, exportProgress, importProgress } from "./ui/menu.js";
import {
  startWords, renderWordsMenu, startWordsMode, renderWordsQuiz,
  selfAnswer, advanceWord, selectWord, renderWordsResult,
  retryWordMistakes, showMasteredList, unmasterAndRefresh, playWordAudio,
} from "./ui/words.js";
import {
  startVerbs, renderVerbsMenu, startVerbsLevel, renderVerbsQuiz, selectVerb, renderVerbsResult,
  retryVerbMistakes, goBackVerb, advanceVerb, showVerbList, showVerbTable, filterVerbs,
} from "./ui/verbs.js";
import { startWriting, renderWritingQuiz, checkWriting, advanceWriting, skipWriting } from "./ui/writing.js";
import {
  startSents, renderSentQuiz, addTile, removeTile, checkSent, nextSent,
} from "./ui/sentences.js";
import {
  startLearn, renderLearnMenu, startLearnMode, renderLearnQuiz,
  selfLearnAnswer, advanceLearnWord, selectLearnWord, renderLearnResult,
  retryLearnMistakes, goBackLearn,
} from "./ui/learn.js";
import {
  startLesson, renderLesson,
  addLessonTile, removeLessonTile, checkLessonTiles, advanceLesson, goBackLesson,
} from "./ui/lesson.js";
import { showProgress } from "./ui/progress.js";
import { showBesednjak, filterBesednjak } from "./ui/besednjak.js";
import { showSlovar, filterSlovar, setSlovarFilter, toggleVerbAccordion, toggleSlovarGroup } from "./ui/slovar.js";
import { startGrammar, showGrammarTopic } from "./ui/grammar.js";
import { initFirebase, fbSignIn, fbSignOut } from "./firebase-sync.js";

async function bootstrap() {
  // 1. Load data (network → fallback to localStorage cache)
  let data;
  try {
    data = await loadAllData();
  } catch (e) {
    document.getElementById("app").innerHTML =
      `<div style="padding:40px;text-align:center;color:#fca5a5">Podatkov ni bilo mogoče naložiti.<br><br><span style="color:#777;font-size:13px">${e.message}</span></div>`;
    return;
  }
  Object.assign(state, data);

  // 2. Hydrate progress and queues from localStorage
  loadWordProgress();
  loadWordQueue();
  loadVerbQueue();
  loadLearnProgress();
  loadLearnQueue();

  // 3. Expose every onclick handler on window — preserves the legacy template style.
  Object.assign(window, {
    // menu
    renderMenu, goMenu, resetProgress, exportProgress, importProgress,
    // words
    startWords, renderWordsMenu, startWordsMode, renderWordsQuiz,
    selfAnswer, advanceWord, selectWord, renderWordsResult,
    retryWordMistakes, showMasteredList, unmasterAndRefresh, playWordAudio,
    // verbs
    startVerbs, renderVerbsMenu, startVerbsLevel, renderVerbsQuiz, selectVerb, renderVerbsResult,
    retryVerbMistakes, goBackVerb, advanceVerb, showVerbList, showVerbTable, filterVerbs,
    // writing
    startWriting, renderWritingQuiz, checkWriting, advanceWriting, skipWriting,
    // learn
    startLearn, renderLearnMenu, startLearnMode, renderLearnQuiz,
    selfLearnAnswer, advanceLearnWord, selectLearnWord, renderLearnResult,
    retryLearnMistakes, goBackLearn,
    // sentences
    startSents, renderSentQuiz, addTile, removeTile, checkSent, nextSent,
    // lesson
    startLesson, renderLesson,
    addLessonTile, removeLessonTile, checkLessonTiles, advanceLesson, goBackLesson,
    // progress
    showProgress,
    showBesednjak, filterBesednjak,
    showSlovar, filterSlovar, setSlovarFilter, toggleVerbAccordion, toggleSlovarGroup,
    startGrammar, showGrammarTopic,
    // firebase
    fbSignIn, fbSignOut,
  });

  // 4. Render initial screen
  renderMenu();

  // 5. Wire up cloud sync (auth state listener + auth bar)
  initFirebase();

  // 6. Register service worker for offline support
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").then(reg => {
      reg.update();
    }).catch((e) => console.warn("SW registration failed:", e));
  }
}

bootstrap();

window.speakSlovenian = function(text) {
  if (!text || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "sl-SI";
  u.rate = 0.9;
  window.speechSynthesis.speak(u);
};

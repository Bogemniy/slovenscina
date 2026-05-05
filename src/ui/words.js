import { state, shuffle, updateWP, unmasterWord, bucketWords } from "../state.js";
import { genWordQuiz, genWordOptions } from "../engine/words.js";
import { app } from "./dom.js";

export function playWordAudio(audioFile) {
  if (!audioFile) return;
  new Audio("mp3/" + audioFile).play().catch(() => {});
}

export function startWords() {
  state.ui = { mode: "words-menu" };
  renderWordsMenu();
}

export function renderWordsMenu() {
  const b = bucketWords();
  const dueCount = b.due.length;
  const newCount = b.new.length;
  const learningCount = b.learning.length;
  const masteredCount = b.mastered.length;
  app().innerHTML = `<div class="menu-card">
    <div class="menu-flag">📝</div>
    <div class="menu-title" style="font-size:24px">Kartice besed</div>
    <div class="menu-sub" style="margin-bottom:18px">Učim: ${learningCount} · Za ponavljanje: ${dueCount} · Novih: ${newCount} · Znam: ${masteredCount}</div>
    <button class="menu-btn words" onclick="startWordsMode('new')" ${newCount === 0 ? 'disabled style="opacity:.5"' : ""}>🌱 Učim novo <span style="opacity:.7;font-size:12px">(${newCount})</span></button>
    <button class="menu-btn words" onclick="startWordsMode('review')" ${dueCount + learningCount === 0 ? 'disabled style="opacity:.5"' : ""}>🔁 Ponavljam <span style="opacity:.7;font-size:12px">(${dueCount} za ponavljanje)</span></button>
    <button class="menu-btn words" onclick="startWordsMode('all')">🎲 Vse skupaj</button>
    ${masteredCount > 0 ? `<button class="menu-btn table-btn" style="font-size:13px;margin-top:10px" onclick="showMasteredList()">⭐ Znam zanesljivo (${masteredCount}) — upravljanje</button>` : ""}
    <button class="btn-menu" onclick="goMenu()" style="margin-top:14px">← Glavni meni</button>
  </div>`;
}

export function startWordsMode(mode) {
  const cards = genWordQuiz(10, mode);
  if (cards.length === 0) {
    alert(
      mode === "new"
        ? "Vse besede se že učijo. Izberi 'Ponavljam' ali 'Vse skupaj'."
        : "Trenutno ni česa ponavljati. Vrni se pozneje ali izberi drug način."
    );
    return;
  }
  state.ui = {
    mode: "words-quiz",
    srMode: mode,
    cards,
    current: 0,
    selected: null,
    revealed: false,
    score: 0,
    mistakes: [],
    streak: 0,
    bestStreak: 0,
  };
  renderWordsQuiz();
}

export function renderWordsQuiz() {
  const { cards, current, selected, revealed, score, streak, srMode } = state.ui;
  const c = cards[current];
  if (c.dir === "sl2ru" && c.audio && selected === null && !revealed) playWordAudio(c.audio);
  const correctAns = c.dir === "sl2ru" ? c.ru : c.sl;
  const p = state.wordProgress[c.sl];
  const lvl = p ? p.level : 0;
  const lvlBar = `<span style="font-size:11px;color:#888">lvl ${lvl}/5</span>`;
  let questionHTML;
  if (c.context) {
    questionHTML = `<div class="card words">
      <div class="card-label words">V stavku</div>
      <div class="card-word" style="font-size:22px;line-height:1.4">${c.context.sentence}</div>
      <div class="card-hint" style="font-size:14px;color:#888;margin-top:8px">${c.context.ru}</div>
      <div class="card-hint">Katera beseda manjka?</div>
    </div>`;
    state.ui._ctxCorrect = c.sl;
  } else {
    questionHTML = `<div class="card words">
      <div class="card-label words">${c.dir === "sl2ru" ? "Slovensko" : "Rusko"}</div>
      <div class="card-word">${c.dir === "sl2ru" ? c.sl : c.ru}</div>
      <div class="card-hint">${revealed ? "" : c.dir === "sl2ru" ? "Izberi prevod:" : "Izberi slovensko besedo:"}</div>
    </div>`;
    state.ui._ctxCorrect = null;
  }
  const ans = c.context ? c.sl : correctAns;
  const selfBtns =
    selected === null && !revealed
      ? `<div class="self-row" style="display:flex;gap:8px;margin-bottom:10px">
    <button class="self-btn know" onclick="selfAnswer(true)" style="flex:1;padding:12px;border:none;border-radius:10px;background:rgba(147,197,253,.15);color:#93c5fd;font-weight:600;cursor:pointer;font-size:14px">✓ Znam</button>
    <button class="self-btn dont" onclick="selfAnswer(false)" style="flex:1;padding:12px;border:none;border-radius:10px;background:rgba(252,165,165,.12);color:#fca5a5;font-weight:600;cursor:pointer;font-size:14px">✗ Ne vem</button>
  </div>`
      : "";
  const revealHTML = revealed
    ? `<div style="background:#1a1a1a;border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:12px;margin-bottom:10px;text-align:center"><div style="font-size:11px;color:#888;margin-bottom:4px">Pravilen odgovor:</div><div style="font-size:18px;font-weight:600;color:#e8eaed">${ans}</div></div>`
    : "";
  app().innerHTML = `<div>
    <div class="top-bar"><span class="progress-text">${current + 1}/${cards.length}</span><span style="font-size:11px;color:#888">${srMode === "new" ? "novo" : srMode === "review" ? "ponavljanje" : "vse skupaj"} · ${lvlBar}</span><span class="score-text score-words">✓ ${score}</span></div>
    <div class="progress-track words"><div class="progress-fill words" style="width:${(current / cards.length) * 100}%"></div></div>
    ${streak >= 3 ? `<div class="streak">🔥 ${streak} zapored!</div>` : ""}
    ${questionHTML}
    ${selfBtns}
    ${revealHTML}
    <div class="options">${c.options
      .map((o, i) => {
        let cls = "opt-btn words";
        if (selected !== null) {
          if (o === ans) cls += " correct";
          else if (o === selected) cls += " wrong";
          else cls += " faded";
        } else if (revealed) {
          if (o === ans) cls += " correct";
          else cls += " faded";
        }
        const btn = `<button class="${cls}" ${selected !== null || revealed ? "disabled" : ""} onclick="selectWord(${i})">${o}</button>`;
        if (c.dir === "ru2sl" && selected === null && !revealed) {
          const af = state.WORDS.find((w) => w.sl === o)?.audio;
          if (af) {
            return `<div style="display:flex;align-items:center;gap:4px">${btn}<button onclick="playWordAudio('${af.replace(/'/g, "\\'")}')" style="flex-shrink:0;padding:6px 8px;border:none;background:transparent;color:#888;cursor:pointer;font-size:16px;line-height:1" title="Poslušaj">🔊</button></div>`;
          }
        }
        return btn;
      })
      .join("")}</div>
    ${revealed ? `<button class="btn-new words" style="margin-top:12px;width:100%" onclick="advanceWord()">Naprej →</button>` : ""}
  </div>`;
}

export function selfAnswer(known) {
  const c = state.ui.cards[state.ui.current];
  if (known) {
    state.ui.score++;
    state.ui.streak++;
    state.ui.bestStreak = Math.max(state.ui.bestStreak, state.ui.streak);
    updateWP(c.sl, true);
    state.ui.selected = state.ui._ctxCorrect || (c.dir === "sl2ru" ? c.ru : c.sl);
    renderWordsQuiz();
    setTimeout(advanceWord, 700);
  } else {
    state.ui.streak = 0;
    state.ui.mistakes.push({ sl: c.sl, ru: c.ru });
    updateWP(c.sl, false);
    state.ui.revealed = true;
    renderWordsQuiz();
  }
}

export function advanceWord() {
  if (state.ui.current + 1 >= state.ui.cards.length) {
    state.ui.mode = "words-result";
    renderWordsResult();
  } else {
    state.ui.current++;
    state.ui.selected = null;
    state.ui.revealed = false;
    state.ui._ctxCorrect = null;
    renderWordsQuiz();
  }
}

export function selectWord(i) {
  if (state.ui.selected !== null || state.ui.revealed) return;
  const c = state.ui.cards[state.ui.current];
  const ans = state.ui._ctxCorrect || (c.dir === "sl2ru" ? c.ru : c.sl);
  state.ui.selected = c.options[i];
  const correct = state.ui.selected === ans;
  if (correct) {
    state.ui.score++;
    state.ui.streak++;
    state.ui.bestStreak = Math.max(state.ui.bestStreak, state.ui.streak);
  } else {
    state.ui.streak = 0;
    state.ui.mistakes.push({ sl: c.sl, ru: c.ru });
  }
  updateWP(c.sl, correct);
  renderWordsQuiz();
  setTimeout(advanceWord, 900);
}

export function renderWordsResult() {
  const { cards, score, bestStreak, mistakes, srMode } = state.ui;
  const pct = Math.round((score / cards.length) * 100);
  const emoji = pct === 100 ? "🏆" : pct >= 80 ? "🌟" : pct >= 60 ? "👍" : "💪";
  app().innerHTML = `<div class="result-card words">
    <div class="result-emoji">${emoji}</div><div class="result-title">Runda končana!</div>
    <div class="result-score words">${score}/${cards.length}</div><div class="result-pct">${pct}% pravilno</div>
    ${bestStreak > 1 ? `<div class="streak-badge">Najboljša serija: ${bestStreak} zapored</div>` : ""}
    ${mistakes.length ? `<div class="mistakes-block"><div class="mistakes-title">Ponovi:</div>${mistakes.map((m) => `<div class="mistake-row"><span class="mistake-sl">${m.sl}</span><span class="mistake-arrow">→</span><span class="mistake-ru">${m.ru}</span></div>`).join("")}</div>` : ""}
    <div class="btn-row">
      ${mistakes.length ? `<button class="btn-retry" onclick="retryWordMistakes()">Ponovi napake</button>` : ""}
      <button class="btn-new words" onclick="startWordsMode('${srMode || "all"}')">Še runda</button>
      <button class="btn-menu" onclick="startWords()">Načini</button>
      <button class="btn-menu" onclick="goMenu()">Meni</button>
    </div>
  </div>`;
}

export function retryWordMistakes() {
  const ms = state.ui.mistakes.map((m) => state.WORDS.find((w) => w.sl === m.sl)).filter(Boolean);
  const cards = shuffle(ms).map((w, i) => {
    const dir = i % 2 === 0 ? "sl2ru" : "ru2sl";
    return { ...w, dir, options: genWordOptions(w, dir) };
  });
  state.ui = {
    mode: "words-quiz",
    srMode: state.ui.srMode || "all",
    cards,
    current: 0,
    selected: null,
    revealed: false,
    score: 0,
    mistakes: [],
    streak: 0,
    bestStreak: 0,
  };
  renderWordsQuiz();
}

export function showMasteredList() {
  const mastered = state.WORDS.filter((w) => state.wordProgress[w.sl] && state.wordProgress[w.sl].mastered);
  app().innerHTML = `<div class="menu-card">
    <div class="menu-flag">⭐</div>
    <div class="menu-title" style="font-size:22px">Znam zanesljivo</div>
    <div class="menu-sub" style="margin-bottom:14px">Te besede se ne prikazujejo pri ponavljanju. Pritisni, da jih vrneš v učenje.</div>
    <div style="max-height:60vh;overflow-y:auto;text-align:left;background:#1a1a1a;border-radius:10px;padding:8px">
    ${
      mastered.length === 0
        ? '<div style="text-align:center;color:#777;padding:20px">Zaenkrat ni</div>'
        : mastered
            .map(
              (w) =>
                `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;border-bottom:1px solid rgba(255,255,255,.06)"><span><b>${w.sl}</b> <span style="color:#777;font-size:13px">— ${w.ru}</span></span><button onclick="unmasterAndRefresh('${w.sl.replace(/'/g, "\\'")}')" style="font-size:12px;padding:5px 10px;border:1px solid rgba(255,255,255,.12);background:#2a2a2a;color:#e8eaed;border-radius:6px;cursor:pointer">↩ vrni</button></div>`
            )
            .join("")
    }
    </div>
    <button class="btn-menu" style="margin-top:14px" onclick="startWords()">← Načini</button>
  </div>`;
}

export function unmasterAndRefresh(sl) {
  unmasterWord(sl);
  showMasteredList();
}

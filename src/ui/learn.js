import { state, shuffle, updateLP, bucketLearn } from "../state.js";
import { genLearnQuiz, genLearnOptions } from "../engine/learn.js";
import { app } from "./dom.js";


export function startLearn() {
  state.ui = { mode: "learn-menu" };
  renderLearnMenu();
}

export function renderLearnMenu() {
  const b = bucketLearn();
  app().innerHTML = `<div class="menu-card">
    <div class="menu-flag">🧠</div>
    <div class="menu-title" style="font-size:24px">Hočem vedeti</div>
    <div class="menu-sub" style="margin-bottom:18px">Učim: ${b.learning.length} · Za ponavljanje: ${b.due.length} · Novih: ${b.new.length} · Znam: ${b.mastered.length}</div>
    <button class="menu-btn words" onclick="startLearnMode('new')" ${b.new.length === 0 ? 'disabled style="opacity:.5"' : ""}>🌱 Učim novo <span style="opacity:.7;font-size:12px">(${b.new.length})</span></button>
    <button class="menu-btn words" onclick="startLearnMode('review')" ${b.due.length + b.learning.length === 0 ? 'disabled style="opacity:.5"' : ""}>🔁 Ponavljam <span style="opacity:.7;font-size:12px">(${b.due.length} za ponavljanje)</span></button>
    <button class="menu-btn words" onclick="startLearnMode('all')">🎲 Vse skupaj</button>
    <button class="btn-menu" onclick="goMenu()" style="margin-top:14px">← Glavni meni</button>
  </div>`;
}

export function startLearnMode(mode) {
  const cards = genLearnQuiz(10, mode).map(c => ({ ...c, answeredWith: null, wasRevealed: false }));
  if (cards.length === 0) {
    alert(
      mode === "new"
        ? "Vse besede se že učijo. Izberi 'Ponavljam' ali 'Vse skupaj'."
        : "Trenutno ni česa ponavljati. Vrni se pozneje ali izberi drug način."
    );
    return;
  }
  state.ui = {
    mode: "learn-quiz",
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
  renderLearnQuiz();
}

export function renderLearnQuiz() {
  const { cards, current, selected, revealed, score, streak, srMode } = state.ui;
  const c = cards[current];
  const correctAns = c.dir === "sl2ru" ? c.ru : c.sl;
  const p = state.learnProgress[c.sl];
  const lvl = p ? p.level : 0;
  const lvlBar = `<span style="font-size:11px;color:#888">lvl ${lvl}/5</span>`;
  const restoredState = selected === null && !revealed && (c.answeredWith !== null || c.wasRevealed);
  const displayAns = selected !== null ? selected : (restoredState ? c.answeredWith : null);
  const effectiveRevealed = revealed || (restoredState && c.wasRevealed);
  const audioBtn = c.dir === "sl2ru"
    ? `<button onclick="speakSlovenian('${c.sl.replace(/'/g, "\\'")}')" style="background:transparent;border:none;color:#888;cursor:pointer;font-size:22px;padding:0">🔊</button>`
    : "";
  const questionHTML = `<div class="card words">
    <div class="card-label words">${c.dir === "sl2ru" ? "Slovensko" : "Rusko"}</div>
    <div class="card-word" style="display:flex;align-items:center;justify-content:center;gap:10px">${c.dir === "sl2ru" ? c.sl : c.ru}${audioBtn}</div>
    <div class="card-hint">${effectiveRevealed ? "" : c.dir === "sl2ru" ? "Izberi prevod:" : "Izberi slovensko besedo:"}</div>
  </div>`;
  const ans = correctAns;
  const selfBtns =
    selected === null && !revealed && !restoredState
      ? `<div class="self-row" style="display:flex;gap:8px;margin-bottom:10px">
    <button class="self-btn know" onclick="selfLearnAnswer(true)" style="flex:1;padding:12px;border:none;border-radius:10px;background:rgba(147,197,253,.15);color:#93c5fd;font-weight:600;cursor:pointer;font-size:14px">✓ Znam</button>
    <button class="self-btn dont" onclick="selfLearnAnswer(false)" style="flex:1;padding:12px;border:none;border-radius:10px;background:rgba(252,165,165,.12);color:#fca5a5;font-weight:600;cursor:pointer;font-size:14px">✗ Ne vem</button>
  </div>`
      : "";
  const revealHTML = effectiveRevealed
    ? `<div style="background:#1a1a1a;border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:12px;margin-bottom:10px;text-align:center"><div style="font-size:11px;color:#888;margin-bottom:4px">Pravilen odgovor:</div><div style="font-size:18px;font-weight:600;color:#e8eaed">${ans}</div></div>`
    : "";
  const showNaprej = effectiveRevealed || (restoredState && c.answeredWith !== null);
  app().innerHTML = `<div>
    <div class="top-bar">${current > 0 ? `<button onclick="goBackLearn()" style="background:transparent;border:none;color:#888;cursor:pointer;font-size:20px;padding:0;line-height:1">←</button>` : `<span></span>`}<span class="progress-text">${current + 1}/${cards.length}</span><span style="font-size:11px;color:#888">${srMode === "new" ? "novo" : srMode === "review" ? "ponavljanje" : "vse skupaj"} · ${lvlBar}</span><span style="display:flex;align-items:center;gap:10px"><span class="score-text score-words">✓ ${score}</span><button onclick="startLearn()" style="background:transparent;border:none;color:#888;cursor:pointer;font-size:16px;padding:0;line-height:1">✕</button></span></div>
    <div class="progress-track words"><div class="progress-fill words" style="width:${(current / cards.length) * 100}%"></div></div>
    ${streak >= 3 ? `<div class="streak">🔥 ${streak} zapored!</div>` : ""}
    ${questionHTML}
    ${selfBtns}
    ${revealHTML}
    <div class="options">${c.options
      .map((o, i) => {
        let cls = "opt-btn words";
        if (displayAns !== null) {
          if (o === ans) cls += " correct";
          else if (o === displayAns) cls += " wrong";
          else cls += " faded";
        } else if (effectiveRevealed) {
          if (o === ans) cls += " correct";
          else cls += " faded";
        }
        const btn = `<button class="${cls}" ${displayAns !== null || effectiveRevealed ? "disabled" : ""} onclick="selectLearnWord(${i})">${o}</button>`;
        if (c.dir === "ru2sl" && displayAns === null && !effectiveRevealed) {
          return `<div style="display:flex;align-items:center;gap:4px">${btn}<button onclick="speakSlovenian('${o.replace(/'/g, "\\'")}')" style="flex-shrink:0;padding:6px 8px;border:none;background:transparent;color:#888;cursor:pointer;font-size:16px;line-height:1">🔊</button></div>`;
        }
        return btn;
      })
      .join("")}</div>
    ${showNaprej ? `<button class="btn-new words" style="margin-top:12px;width:100%" onclick="advanceLearnWord()">Naprej →</button>` : ""}
  </div>`;
}

export function selfLearnAnswer(known) {
  const c = state.ui.cards[state.ui.current];
  if (known) {
    state.ui.score++;
    state.ui.streak++;
    state.ui.bestStreak = Math.max(state.ui.bestStreak, state.ui.streak);
    updateLP(c.sl, true);
    c.answeredWith = c.dir === "sl2ru" ? c.ru : c.sl;
    state.ui.selected = c.answeredWith;
    renderLearnQuiz();
    setTimeout(advanceLearnWord, 700);
  } else {
    state.ui.streak = 0;
    state.ui.mistakes.push({ sl: c.sl, ru: c.ru });
    updateLP(c.sl, false);
    c.wasRevealed = true;
    state.ui.revealed = true;
    renderLearnQuiz();
  }
}

export function advanceLearnWord() {
  if (state.ui.current + 1 >= state.ui.cards.length) {
    state.ui.mode = "learn-result";
    renderLearnResult();
  } else {
    state.ui.current++;
    state.ui.selected = null;
    state.ui.revealed = false;
    renderLearnQuiz();
  }
}

export function selectLearnWord(i) {
  if (state.ui.selected !== null || state.ui.revealed || state.ui.cards[state.ui.current].answeredWith !== null) return;
  const c = state.ui.cards[state.ui.current];
  const ans = c.dir === "sl2ru" ? c.ru : c.sl;
  c.answeredWith = c.options[i];
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
  updateLP(c.sl, correct);
  renderLearnQuiz();
  setTimeout(advanceLearnWord, 900);
}

export function renderLearnResult() {
  const { cards, score, bestStreak, mistakes, srMode } = state.ui;
  const pct = Math.round((score / cards.length) * 100);
  const emoji = pct === 100 ? "🏆" : pct >= 80 ? "🌟" : pct >= 60 ? "👍" : "💪";
  app().innerHTML = `<div class="result-card words">
    <div class="result-emoji">${emoji}</div><div class="result-title">Runda končana!</div>
    <div class="result-score words">${score}/${cards.length}</div><div class="result-pct">${pct}% pravilno</div>
    ${bestStreak > 1 ? `<div class="streak-badge">Najboljša serija: ${bestStreak} zapored</div>` : ""}
    ${mistakes.length ? `<div class="mistakes-block"><div class="mistakes-title">Ponovi:</div>${mistakes.map((m) => `<div class="mistake-row"><span class="mistake-sl">${m.sl}</span><span class="mistake-arrow">→</span><span class="mistake-ru">${m.ru}</span></div>`).join("")}</div>` : ""}
    <div class="btn-row">
      ${mistakes.length ? `<button class="btn-retry" onclick="retryLearnMistakes()">Ponovi napake</button>` : ""}
      <button class="btn-new words" onclick="startLearnMode('${srMode || "all"}')">Še runda</button>
      <button class="btn-menu" onclick="startLearn()">Načini</button>
      <button class="btn-menu" onclick="goMenu()">Meni</button>
    </div>
  </div>`;
}

export function goBackLearn() {
  state.ui.current--;
  state.ui.selected = null;
  state.ui.revealed = false;
  renderLearnQuiz();
}

export function retryLearnMistakes() {
  const ms = state.ui.mistakes.map((m) => state.LEARN.find((w) => w.sl === m.sl)).filter(Boolean);
  const cards = shuffle(ms).map((w, i) => {
    const dir = i % 2 === 0 ? "sl2ru" : "ru2sl";
    return { ...w, dir, options: genLearnOptions(w, dir), answeredWith: null, wasRevealed: false };
  });
  state.ui = {
    mode: "learn-quiz",
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
  renderLearnQuiz();
}

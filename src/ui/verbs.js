import { state, shuffle, getNegForm } from "../state.js";
import { genVerbQuiz, genVerbOptions } from "../engine/verbs.js";
import { app } from "./dom.js";

export function startVerbs() {
  state.ui = {
    mode: "verbs-quiz",
    cards: genVerbQuiz(10),
    current: 0,
    selected: null,
    score: 0,
    mistakes: [],
    streak: 0,
    bestStreak: 0,
  };
  renderVerbsQuiz();
}

export function renderVerbsQuiz() {
  const { cards, current, selected, score, streak } = state.ui;
  const c = cards[current];
  const correctAns = c.negative ? getNegForm(c.verb, c.pronoun) : c.verb.forms[c.pronoun];
  app().innerHTML = `<div>
    <div class="top-bar"><button onclick="goMenu()" style="background:transparent;border:none;color:#888;cursor:pointer;font-size:20px;padding:0;line-height:1">←</button><span class="progress-text">${current + 1}/${cards.length}</span><span class="score-text score-verbs">✓ ${score}</span></div>
    <div class="progress-track verbs"><div class="progress-fill verbs" style="width:${(current / cards.length) * 100}%"></div></div>
    ${streak >= 3 ? `<div class="streak">🔥 ${streak} zapored!</div>` : ""}
    <div class="card verbs">
      <div class="card-label verbs">Glagol</div>
      <div class="card-word">${c.verb.inf}</div>
      <div class="card-sub">${c.verb.ru}</div>
      ${c.negative ? '<div class="neg-badge">NEGATIVNO</div>' : ""}
      <div class="pronoun-box"><span class="pronoun-label">${c.pronoun}</span></div>
      <div class="card-hint">${c.negative ? "Izberi nikalno obliko:" : "Izberi pravilno obliko:"}</div>
    </div>
    <div class="options">${c.options
      .map((o, i) => {
        let cls = "opt-btn verbs";
        if (selected !== null) {
          if (o === correctAns) cls += " correct";
          else if (o === selected) cls += " wrong";
          else cls += " faded";
        }
        return `<button class="${cls}" ${selected !== null ? "disabled" : ""} onclick="selectVerb(${i})">${o}</button>`;
      })
      .join("")}</div>
  </div>`;
}

export function selectVerb(i) {
  if (state.ui.selected !== null) return;
  const c = state.ui.cards[state.ui.current];
  const correctAns = c.negative ? getNegForm(c.verb, c.pronoun) : c.verb.forms[c.pronoun];
  state.ui.selected = c.options[i];
  if (state.ui.selected === correctAns) {
    state.ui.score++;
    state.ui.streak++;
    state.ui.bestStreak = Math.max(state.ui.bestStreak, state.ui.streak);
  } else {
    state.ui.streak = 0;
    state.ui.mistakes.push(c);
  }
  renderVerbsQuiz();
  setTimeout(() => {
    if (state.ui.current + 1 >= state.ui.cards.length) {
      state.ui.mode = "verbs-result";
      renderVerbsResult();
    } else {
      state.ui.current++;
      state.ui.selected = null;
      renderVerbsQuiz();
    }
  }, 900);
}

export function renderVerbsResult() {
  const { cards, score, bestStreak, mistakes } = state.ui;
  const pct = Math.round((score / cards.length) * 100);
  const emoji = pct === 100 ? "🏆" : pct >= 80 ? "🌟" : pct >= 60 ? "👍" : "💪";
  app().innerHTML = `<div class="result-card verbs">
    <div class="result-emoji">${emoji}</div><div class="result-title">Runda končana!</div>
    <div class="result-score verbs">${score}/${cards.length}</div><div class="result-pct">${pct}% pravilno</div>
    ${bestStreak > 1 ? `<div class="streak-badge">Najboljša serija: ${bestStreak} zapored</div>` : ""}
    ${mistakes.length ? `<div class="mistakes-block"><div class="mistakes-title">Ponovi:</div>${mistakes.map((m) => `<div class="mistake-row"><span class="mistake-sl verbs">${m.verb.inf}${m.negative ? " ✗" : ""}</span><span style="color:#f9a8d4;font-size:12px">${state.PRONOUN_SHORT[m.pronoun]}</span><span class="mistake-arrow">→</span><span class="mistake-ru">${m.negative ? getNegForm(m.verb, m.pronoun) : m.verb.forms[m.pronoun]}</span></div>`).join("")}</div>` : ""}
    <div class="btn-row">
      ${mistakes.length ? `<button class="btn-retry" onclick="retryVerbMistakes()">Ponovi napake</button>` : ""}
      <button class="btn-new verbs" onclick="startVerbs()">Nova runda</button>
      <button class="btn-menu" onclick="goMenu()">Meni</button>
    </div>
  </div>`;
}

export function retryVerbMistakes() {
  const cards = shuffle(state.ui.mistakes).map((q) => ({
    verb: q.verb,
    pronoun: q.pronoun,
    negative: q.negative,
    options: genVerbOptions(q.verb, q.pronoun, q.negative),
  }));
  state.ui = { mode: "verbs-quiz", cards, current: 0, selected: null, score: 0, mistakes: [], streak: 0, bestStreak: 0 };
  renderVerbsQuiz();
}

// --- VERB TABLE ---
export function showVerbList() {
  app().innerHTML = `<div class="table-card">
    <button class="back-btn" onclick="goMenu()">← Meni</button>
    <div style="font-size:20px;font-weight:700;margin-bottom:16px">Tabele spregatev</div>
    <div class="verb-grid">${state.VERBS.map((v, i) => `<button class="verb-chip" onclick="showVerbTable(${i})">${v.inf}</button>`).join("")}</div>
  </div>`;
}

export function showVerbTable(i) {
  const v = state.VERBS[i];
  app().innerHTML = `<div class="table-card">
    <button class="back-btn" onclick="showVerbList()">← Nazaj</button>
    <div class="table-inf">${v.inf}</div><div class="table-ru">${v.ru}</div>
    <div class="table-header"><span style="flex:1">zaimek</span><span class="pos" style="flex:1;text-align:center">✓</span><span class="neg" style="flex:1;text-align:right">✗</span></div>
    ${state.PRONOUNS.map((p) => `<div class="table-row"><span class="table-pronoun">${p}</span><span class="table-form">${v.forms[p]}</span><span class="table-neg">${getNegForm(v, p)}</span></div>`).join("")}
    <div style="margin-top:16px"><button class="back-btn" onclick="showVerbList()">← Vsi glagoli</button></div>
  </div>`;
}

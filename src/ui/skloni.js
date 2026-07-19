import { state } from "../state.js";
import { genSkloniSession, CASE_LABELS, NUM_LABELS } from "../engine/skloni.js";
import { app } from "./dom.js";

const GENDER_STYLE = {
  m: "background:#1a2e45;color:#93c5fd",
  ž: "background:#3a1a28;color:#f9a8d4",
  s: "background:#0e2e22;color:#6ee7b7",
};

function gBadge(g) {
  const style = GENDER_STYLE[g] || "background:#333;color:#aaa";
  return `<span style="flex-shrink:0;font-size:11px;font-weight:700;padding:3px 7px;border-radius:6px;${style}">${g}</span>`;
}

function safe(s) {
  return s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

export function startSkloni() {
  if (!state.NOUNS || state.NOUNS.length === 0) return;
  const questions = genSkloniSession(state.NOUNS, 10);
  state.ui = {
    mode: "skloni-quiz",
    questions,
    current: 0,
    selected: null,
    score: 0,
    mistakes: [],
    _timer: null,
  };
  renderSkloniQuiz();
}

export function renderSkloniQuiz() {
  const { questions, current, selected, score } = state.ui;
  const q = questions[current];
  const { noun, num, cas, correct, options } = q;
  const ci = CASE_LABELS[cas];
  const ni = NUM_LABELS[num];
  const answered = selected !== null;

  app().innerHTML = `<div>
    <div class="top-bar">
      <span class="progress-text">${current + 1}/10</span>
      <span class="score-text score-nouns">✓ ${score}</span>
      <button onclick="goMenu()" style="background:transparent;border:none;color:#888;cursor:pointer;font-size:16px;padding:0;line-height:1">✕</button>
    </div>
    <div class="progress-track nouns"><div class="progress-fill nouns" style="width:${(current / questions.length) * 100}%"></div></div>

    <div class="card nouns">
      <div class="card-label nouns">Skloni</div>
      <div style="display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
        <span style="font-size:28px;font-weight:700;color:#fff">${noun.sl}</span>
        ${gBadge(noun.g)}
        <button onclick="speakSlovenian('${safe(noun.sl)}')" style="background:none;border:none;cursor:pointer;color:#555;font-size:16px;padding:0;line-height:1">🔊</button>
      </div>
      <div class="card-sub">${noun.ru}</div>
      <div style="margin-top:12px;padding:10px 16px;background:rgba(251,146,60,.07);border-radius:12px;border:1px solid rgba(251,146,60,.15)">
        <div style="font-size:15px;font-weight:700;color:#fb923c">${ci.sl} <span style="font-size:12px;font-weight:400;color:#888">${ci.ru}</span></div>
        <div style="font-size:12px;color:#888;margin-top:3px">${ni.sl} · ${ni.ru}</div>
      </div>
    </div>

    <div class="options">
      ${options.map((opt, i) => {
        let cls = "opt-btn nouns";
        if (answered) {
          if (opt === correct) cls += " correct";
          else if (opt === selected) cls += " wrong";
          else cls += " faded";
        }
        return `<button class="${cls}" ${answered ? "disabled" : ""} onclick="answerSkloni(${i})">${opt}</button>`;
      }).join("")}
    </div>

    ${answered ? `
    <div style="text-align:center;margin-top:10px">
      <button onclick="speakSlovenian('${safe(correct)}')" style="background:none;border:1px solid rgba(251,146,60,.3);border-radius:8px;padding:4px 12px;cursor:pointer;color:#fb923c;font-size:13px">🔊 ${correct}</button>
    </div>
    <button class="btn-new nouns" style="margin-top:10px;width:100%" onclick="nextSkloni()">Naprej →</button>
    ` : ""}
  </div>`;
}

export function answerSkloni(i) {
  if (state.ui.selected !== null) return;
  const q = state.ui.questions[state.ui.current];
  const chosen = q.options[i];
  state.ui.selected = chosen;
  if (chosen === q.correct) {
    state.ui.score++;
    state.ui._timer = setTimeout(nextSkloni, 900);
  } else {
    state.ui.mistakes.push({ sl: q.noun.sl, cas: q.cas, num: q.num, correct: q.correct });
  }
  renderSkloniQuiz();
}

export function nextSkloni() {
  clearTimeout(state.ui._timer);
  const { questions, current } = state.ui;
  if (current + 1 >= questions.length) {
    state.ui.mode = "skloni-result";
    renderSkloniResult();
  } else {
    state.ui.current++;
    state.ui.selected = null;
    renderSkloniQuiz();
  }
}

export function renderSkloniResult() {
  const { questions, score, mistakes } = state.ui;
  const pct = Math.round((score / questions.length) * 100);
  const emoji = pct === 100 ? "🏆" : pct >= 80 ? "🌟" : pct >= 60 ? "👍" : "💪";
  const mistakesHTML = mistakes.length
    ? `<div class="mistakes-block">
        <div class="mistakes-title">Napake:</div>
        ${mistakes.map(m => {
          const cl = CASE_LABELS[m.cas];
          const nl = NUM_LABELS[m.num];
          return `<div class="mistake-row">
            <span style="color:#fb923c;font-weight:600;flex:1;min-width:0;overflow-wrap:anywhere">${m.sl}</span>
            <span style="color:#666;font-size:11px;flex:1.4;text-align:center">${cl.sl}, ${nl.sl}</span>
            <span style="color:#e8eaed;font-weight:600;flex:1;text-align:right">${m.correct}</span>
          </div>`;
        }).join("")}
      </div>`
    : "";

  app().innerHTML = `<div class="result-card nouns">
    <div class="result-emoji">${emoji}</div>
    <div class="result-title">Runda končana!</div>
    <div class="result-score nouns">${score}/${questions.length}</div>
    <div class="result-pct">${pct}% pravilno</div>
    ${mistakesHTML}
    <div class="btn-row">
      <button class="btn-new nouns" onclick="startSkloni()">Nova runda</button>
      <button class="btn-menu" onclick="goMenu()">Meni</button>
    </div>
  </div>`;
}

import { state, shuffle, getNegForm } from "../state.js";
import { genVerbQuiz, genVerbPastQuiz, genVerbOptions, genVerbPastOptions } from "../engine/verbs.js";
import { app } from "./dom.js";

const TAB_ACTIVE = `flex:1;padding:8px;border-radius:8px;border:1px solid rgba(249,168,212,.4);background:rgba(249,168,212,.15);color:#f9a8d4;font-size:13px;font-weight:600;cursor:pointer`;
const TAB_INACTIVE = `flex:1;padding:8px;border-radius:8px;border:1px solid rgba(255,255,255,.1);background:#1a1a1a;color:#888;font-size:13px;cursor:pointer`;
const TAB_DISABLED = `flex:1;padding:8px;border-radius:8px;border:1px solid rgba(255,255,255,.1);background:#1a1a1a;color:#888;font-size:13px;cursor:not-allowed;opacity:.4`;

function tenseTabs(tense, onClickFn) {
  return `<div style="display:flex;gap:6px;margin-bottom:18px">
    <button style="${tense === "present" ? TAB_ACTIVE : TAB_INACTIVE}" onclick="${onClickFn}('present')">Sedanjik</button>
    <button style="${tense === "past" ? TAB_ACTIVE : TAB_INACTIVE}" onclick="${onClickFn}('past')">Preteklik</button>
    <button style="${TAB_DISABLED}" disabled>Prihodnjik</button>
  </div>`;
}

export function startVerbs() {
  state.ui = { mode: "verbs-menu" };
  renderVerbsMenu();
}

export function renderVerbsMenu(tense = "present") {
  const counts = {
    1: state.VERBS.filter((v) => v.level === 1).length,
    2: state.VERBS.filter((v) => v.level === 2).length,
    3: state.VERBS.filter((v) => v.level === 3).length,
  };
  app().innerHTML = `<div class="menu-card">
    <div class="menu-flag">🔤</div>
    <div class="menu-title" style="font-size:24px">Spregatve glagolov</div>
    <div class="menu-sub" style="margin-bottom:18px">Izberi težavnost</div>
    ${tenseTabs(tense, "renderVerbsMenu")}
    <button class="menu-btn" style="background:linear-gradient(135deg,rgba(249,168,212,.18),rgba(236,72,153,.1));border:1px solid rgba(249,168,212,.25);color:#f9a8d4" onclick="startVerbsLevel(1,'${tense}')">🌱 Osnovno <span style="opacity:.7;font-size:12px">(${counts[1]} glagolov)</span></button>
    <button class="menu-btn" style="background:linear-gradient(135deg,rgba(249,168,212,.18),rgba(236,72,153,.1));border:1px solid rgba(249,168,212,.25);color:#f9a8d4" onclick="startVerbsLevel(2,'${tense}')">📚 Srednje <span style="opacity:.7;font-size:12px">(${counts[2]} glagolov)</span></button>
    <button class="menu-btn" style="background:linear-gradient(135deg,rgba(249,168,212,.18),rgba(236,72,153,.1));border:1px solid rgba(249,168,212,.25);color:#f9a8d4" onclick="startVerbsLevel(3,'${tense}')">🎓 Napredno <span style="opacity:.7;font-size:12px">(${counts[3]} glagolov)</span></button>
    <button class="menu-btn" style="background:linear-gradient(135deg,rgba(249,168,212,.18),rgba(236,72,153,.1));border:1px solid rgba(249,168,212,.25);color:#f9a8d4" onclick="startVerbsLevel(0,'${tense}')">🎲 Vse skupaj <span style="opacity:.7;font-size:12px">(${state.VERBS.length} glagolov)</span></button>
    <button class="btn-menu" onclick="goMenu()" style="margin-top:14px">← Glavni meni</button>
  </div>`;
}

export function startVerbsLevel(level, tense = "present") {
  const cards = (tense === "past" ? genVerbPastQuiz(10, level) : genVerbQuiz(10, level)).map(c => ({ ...c, answeredWith: null }));
  state.ui = { mode: "verbs-quiz", verbLevel: level, tense, cards, current: 0, selected: null, score: 0, mistakes: [], streak: 0, bestStreak: 0 };
  renderVerbsQuiz();
}

export function renderVerbsQuiz() {
  const { cards, current, selected, score, streak, tense } = state.ui;
  const c = cards[current];
  const isPast = tense === "past";
  const correctAns = isPast ? c.verb.past[c.pronoun] : (c.negative ? getNegForm(c.verb, c.pronoun) : c.verb.forms[c.pronoun]);
  const restoredState = selected === null && c.answeredWith !== null;
  const displayAns = selected !== null ? selected : (restoredState ? c.answeredWith : null);
  app().innerHTML = `<div>
    <div class="top-bar">${current > 0 ? `<button onclick="goBackVerb()" style="background:transparent;border:none;color:#888;cursor:pointer;font-size:20px;padding:0;line-height:1">←</button>` : `<span></span>`}<span class="progress-text">${current + 1}/${cards.length}</span><span style="display:flex;align-items:center;gap:10px"><span class="score-text score-verbs">✓ ${score}</span><button onclick="startVerbs()" style="background:transparent;border:none;color:#888;cursor:pointer;font-size:16px;padding:0;line-height:1">✕</button></span></div>
    <div class="progress-track verbs"><div class="progress-fill verbs" style="width:${(current / cards.length) * 100}%"></div></div>
    ${streak >= 3 ? `<div class="streak">🔥 ${streak} zapored!</div>` : ""}
    <div class="card verbs">
      <div class="card-label verbs">${isPast ? "Preteklik" : "Glagol"}</div>
      <div class="card-word">${c.verb.inf}</div>
      <div class="card-sub">${c.verb.ru}</div>
      ${!isPast && c.negative ? '<div class="neg-badge">NEGATIVNO</div>' : ""}
      <div class="pronoun-box"><span class="pronoun-label">${c.pronoun}</span></div>
      <div class="card-hint">${isPast ? "Izberi obliko preteklika:" : (c.negative ? "Izberi nikalno obliko:" : "Izberi pravilno obliko:")}</div>
    </div>
    <div class="options">${c.options
      .map((o, i) => {
        let cls = "opt-btn verbs";
        if (displayAns !== null) {
          if (o === correctAns) cls += " correct";
          else if (o === displayAns) cls += " wrong";
          else cls += " faded";
        }
        return `<button class="${cls}" ${displayAns !== null ? "disabled" : ""} onclick="selectVerb(${i})">${o}</button>`;
      })
      .join("")}</div>
    ${restoredState ? `<button class="btn-new verbs" style="margin-top:12px;width:100%" onclick="advanceVerb()">Naprej →</button>` : ""}
  </div>`;
}

export function selectVerb(i) {
  if (state.ui.selected !== null || state.ui.cards[state.ui.current].answeredWith !== null) return;
  const c = state.ui.cards[state.ui.current];
  const isPast = state.ui.tense === "past";
  const correctAns = isPast ? c.verb.past[c.pronoun] : (c.negative ? getNegForm(c.verb, c.pronoun) : c.verb.forms[c.pronoun]);
  state.ui.selected = c.options[i];
  c.answeredWith = c.options[i];
  if (state.ui.selected === correctAns) {
    state.ui.score++;
    state.ui.streak++;
    state.ui.bestStreak = Math.max(state.ui.bestStreak, state.ui.streak);
  } else {
    state.ui.streak = 0;
    state.ui.mistakes.push(c);
  }
  renderVerbsQuiz();
  setTimeout(advanceVerb, 900);
}

export function advanceVerb() {
  if (state.ui.current + 1 >= state.ui.cards.length) {
    state.ui.mode = "verbs-result";
    renderVerbsResult();
  } else {
    state.ui.current++;
    state.ui.selected = null;
    renderVerbsQuiz();
  }
}

export function renderVerbsResult() {
  const { cards, score, bestStreak, mistakes, tense, verbLevel } = state.ui;
  const pct = Math.round((score / cards.length) * 100);
  const emoji = pct === 100 ? "🏆" : pct >= 80 ? "🌟" : pct >= 60 ? "👍" : "💪";
  const isPast = tense === "past";
  const getCorrect = (m) => isPast ? m.verb.past[m.pronoun] : (m.negative ? getNegForm(m.verb, m.pronoun) : m.verb.forms[m.pronoun]);
  app().innerHTML = `<div class="result-card verbs">
    <div class="result-emoji">${emoji}</div><div class="result-title">Runda končana!</div>
    <div class="result-score verbs">${score}/${cards.length}</div><div class="result-pct">${pct}% pravilno</div>
    ${bestStreak > 1 ? `<div class="streak-badge">Najboljša serija: ${bestStreak} zapored</div>` : ""}
    ${mistakes.length ? `<div class="mistakes-block"><div class="mistakes-title">Ponovi:</div>${mistakes.map((m) => `<div class="mistake-row"><span class="mistake-sl verbs">${m.verb.inf}${!isPast && m.negative ? " ✗" : ""}</span><span style="color:#f9a8d4;font-size:12px">${state.PRONOUN_SHORT[m.pronoun]}</span><span class="mistake-arrow">→</span><span class="mistake-ru">${getCorrect(m)}</span></div>`).join("")}</div>` : ""}
    <div class="btn-row">
      ${mistakes.length ? `<button class="btn-retry" onclick="retryVerbMistakes()">Ponovi napake</button>` : ""}
      <button class="btn-new verbs" onclick="startVerbsLevel(${verbLevel || 0},'${tense || "present"}')">Nova runda</button>
      <button class="btn-menu" onclick="goMenu()">Meni</button>
    </div>
  </div>`;
}

export function goBackVerb() {
  state.ui.current--;
  state.ui.selected = null;
  renderVerbsQuiz();
}

export function retryVerbMistakes() {
  const { tense } = state.ui;
  const isPast = tense === "past";
  const cards = shuffle(state.ui.mistakes).map((q) => ({
    verb: q.verb,
    pronoun: q.pronoun,
    negative: isPast ? false : q.negative,
    options: isPast ? genVerbPastOptions(q.verb, q.pronoun) : genVerbOptions(q.verb, q.pronoun, q.negative),
    answeredWith: null,
  }));
  state.ui = { mode: "verbs-quiz", tense, cards, current: 0, selected: null, score: 0, mistakes: [], streak: 0, bestStreak: 0 };
  renderVerbsQuiz();
}

// --- VERB TABLE ---
export function showVerbList(tense = "present") {
  const groups = [
    { id: "vg1", label: "🌱 Osnovno", level: 1, open: false },
    { id: "vg2", label: "📚 Srednje",  level: 2, open: false },
    { id: "vg3", label: "🎓 Napredno", level: 3, open: false },
  ];
  const sectionsHTML = groups.map(({ id, label, level, open }) => {
    const verbs = state.VERBS.map((v, i) => ({ v, i })).filter(({ v }) => v.level === level);
    const chips = verbs.map(({ v, i }) => `<button class="verb-chip" onclick="showVerbTable(${i},'${tense}')">${v.inf}</button>`).join("");
    return `
      <div style="margin-bottom:8px;border:1px solid rgba(255,255,255,.08);border-radius:10px;overflow:hidden">
        <div onclick="(function(el){var c=document.getElementById('${id}');c.style.display=c.style.display==='none'?'block':'none';el.querySelector('.acc-arrow').textContent=c.style.display==='none'?'▶':'▼'})(this)" style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;cursor:pointer;background:#1a1a1a;font-weight:600;font-size:14px">
          <span>${label} <span style="font-size:12px;opacity:.6">(${verbs.length})</span></span>
          <span class="acc-arrow">${open ? "▼" : "▶"}</span>
        </div>
        <div id="${id}" style="display:${open ? "block" : "none"};padding:10px;max-height:300px;overflow-y:auto">
          <div class="verb-grid">${chips}</div>
        </div>
      </div>`;
  }).join("");

  app().innerHTML = `<div class="table-card">
    <button class="back-btn" onclick="goMenu()">← Meni</button>
    <div style="font-size:20px;font-weight:700;margin-bottom:12px">Tabele spregatev</div>
    ${tenseTabs(tense, "showVerbList")}
    <input id="verb-search" type="text"
      oninput="filterVerbs(this.value,'${tense}')"
      placeholder="Išči glagol..."
      style="width:100%;box-sizing:border-box;padding:10px 14px;font-size:15px;border-radius:10px;border:1px solid rgba(255,255,255,.15);background:#1a1a1a;color:#e8eaed;outline:none;margin-bottom:12px"
      autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
    />
    <div id="verb-search-results" style="display:none"></div>
    <div id="verb-sections">${sectionsHTML}</div>
  </div>`;
}

export function filterVerbs(query, tense = "present") {
  const q = query.trim().toLowerCase();
  const resultsDiv = document.getElementById("verb-search-results");
  const sectionsDiv = document.getElementById("verb-sections");
  if (!q) {
    resultsDiv.style.display = "none";
    sectionsDiv.style.display = "block";
    return;
  }
  const matches = state.VERBS
    .map((v, i) => ({ v, i }))
    .filter(({ v }) => {
      const allForms = [v.inf, v.ru, ...Object.values(v.forms || {}), ...Object.values(v.past || {})];
      return allForms.some(f => f.toLowerCase().includes(q));
    });
  resultsDiv.style.display = "block";
  sectionsDiv.style.display = "none";
  resultsDiv.innerHTML = matches.length === 0
    ? '<div style="text-align:center;color:#777;padding:20px">Ni rezultatov</div>'
    : '<div class="verb-grid">' + matches.map(({ v, i }) => `<button class="verb-chip" onclick="showVerbTable(${i},'${tense}')">${v.inf}</button>`).join("") + '</div>';
}

export function showVerbTable(i, tense = "present") {
  const v = state.VERBS[i];
  const isPast = tense === "past";
  const header = isPast
    ? `<div class="table-header"><span style="flex:1">zaimek</span><span class="pos" style="flex:2;text-align:left;padding-left:8px">preteklik</span></div>`
    : `<div class="table-header"><span style="flex:1">zaimek</span><span class="pos" style="flex:1;text-align:center">✓</span><span class="neg" style="flex:1;text-align:right">✗</span></div>`;
  const rows = isPast
    ? state.PRONOUNS.map((p) => `<div class="table-row"><span class="table-pronoun">${p}</span><span class="table-form" style="flex:2;text-align:left">${v.past ? v.past[p] : "—"}</span></div>`).join("")
    : state.PRONOUNS.map((p) => `<div class="table-row"><span class="table-pronoun">${p}</span><span class="table-form">${v.forms[p]}</span><span class="table-neg">${getNegForm(v, p)}</span></div>`).join("");
  app().innerHTML = `<div class="table-card">
    <button class="back-btn" onclick="showVerbList('${tense}')">← Nazaj</button>
    <div class="table-inf">${v.inf}</div><div class="table-ru">${v.ru}</div>
    ${header}
    ${rows}
    <div style="margin-top:16px"><button class="back-btn" onclick="showVerbList('${tense}')">← Vsi glagoli</button></div>
  </div>`;
}

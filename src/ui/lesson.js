import { state } from "../state.js";
import { genLesson } from "../engine/lesson.js";
import { app } from "./dom.js";

let _keyHandler = null;

export function startLesson() {
  const { cat, cards } = genLesson();
  state.ui = {
    mode: "lesson",
    cat,
    cards,
    current: 0,
    score: 0,
    mistakes: [],
    checked: false,
  };
  renderLesson();
}

export function renderLesson() {
  const { cards, current, score } = state.ui;
  const c = cards[current];

  const usedIdxs = [];
  c.answer.forEach(aw => {
    for (let i = 0; i < c.tiles.length; i++) {
      if (c.tiles[i] === aw && usedIdxs.indexOf(i) === -1) { usedIdxs.push(i); break; }
    }
  });
  let answerHtml = c.answer.length === 0
    ? '<span style="color:#777;font-size:14px">Pritisni na besede spodaj</span>'
    : c.answer.map((w, i) => {
        let cls = "tile";
        if (c.checked) cls += c.correct ? " correct-tile" : (i < c.sl.length && w === c.sl[i] ? " correct-tile" : " wrong-tile");
        return `<span class="${cls}" onclick="${c.checked ? "" : `removeLessonTile(${i})`}">${w}</span>`;
      }).join("");
  let bankHtml = c.tiles.map((w, i) => {
    const isUsed = usedIdxs.indexOf(i) >= 0;
    return `<span class="tile${isUsed ? " used" : ""}" onclick="${c.checked || isUsed ? "" : `addLessonTile(${i})`}">${w}</span>`;
  }).join("");
  const bodyHTML = `
    <div class="sent-card"><div class="sent-label">Prevedi</div><div class="sent-ru">${c.ru}</div></div>
    <div class="answer-area">${answerHtml}</div>
    <div class="word-bank">${bankHtml}</div>
    ${c.checked
      ? `${!c.correct ? `<div style="text-align:center;margin:8px 0"><div style="color:#fca5a5;font-size:14px">Pravilen odgovor:</div><div class="sent-correct-answer">${c.sl.join(" ")}</div></div>` : ""}
         <button class="btn-check btn-next" onclick="advanceLesson()">Naprej →</button>`
      : `<button class="btn-check" ${c.answer.length === 0 ? "disabled" : ""} onclick="checkLessonTiles()">Preveri</button>`}`;

  app().innerHTML = `<div>
    <div class="top-bar">
      ${current > 0 ? `<button onclick="goBackLesson()" style="background:transparent;border:none;color:#888;cursor:pointer;font-size:20px;padding:0;line-height:1">←</button>` : `<span></span>`}
      <span class="progress-text">${current + 1}/${cards.length}</span>
      <span style="display:flex;align-items:center;gap:10px"><span class="score-text score-words">✓ ${score}</span><button onclick="goMenu()" style="background:transparent;border:none;color:#888;cursor:pointer;font-size:16px;padding:0;line-height:1">✕</button></span>
    </div>
    <div class="progress-track words"><div class="progress-fill words" style="width:${(current / cards.length) * 100}%"></div></div>
    ${bodyHTML}
  </div>`;

  if (_keyHandler) document.removeEventListener("keydown", _keyHandler);
  _keyHandler = (e) => {
    if (e.key !== "Enter") return;
    document.removeEventListener("keydown", _keyHandler);
    _keyHandler = null;
    const card = state.ui.cards[state.ui.current];
    if (state.ui.checked) {
      advanceLesson();
    } else if (card.type === "tiles" && card.answer.length > 0) {
      checkLessonTiles();
    }
  };
  setTimeout(() => document.addEventListener("keydown", _keyHandler), 100);
}

export function goBackLesson() {
  state.ui.current--;
  const c = state.ui.cards[state.ui.current];
  state.ui.checked = c._checked || false;
  renderLesson();
}

export function addLessonTile(bankIdx) {
  const c = state.ui.cards[state.ui.current];
  if (c.checked) return;
  c.answer.push(c.tiles[bankIdx]);
  renderLesson();
}

export function removeLessonTile(ansIdx) {
  const c = state.ui.cards[state.ui.current];
  if (c.checked) return;
  c.answer.splice(ansIdx, 1);
  renderLesson();
}

export function checkLessonTiles() {
  const c = state.ui.cards[state.ui.current];
  c.checked = true;
  c._checked = true;
  c.correct = c.answer.join(" ") === c.sl.join(" ");
  if (c.correct) state.ui.score++;
  else state.ui.mistakes.push({ sl: c.sl.join(" "), ru: c.ru });
  state.ui.checked = true;
  renderLesson();
}

export function advanceLesson() {
  if (state.ui.current + 1 >= state.ui.cards.length) {
    renderLessonResult();
    return;
  }
  state.ui.current++;
  state.ui.checked = false;
  renderLesson();
}

function renderLessonResult() {
  const { cards, score, mistakes } = state.ui;
  const pct = Math.round((score / cards.length) * 100);
  const emoji = pct === 100 ? "🏆" : pct >= 80 ? "🌟" : pct >= 60 ? "👍" : "💪";
  app().innerHTML = `<div class="result-card words">
    <div class="result-emoji">${emoji}</div>
    <div class="result-title">Lekcija končana!</div>
    <div class="result-score words">${score}/${cards.length}</div>
    <div class="result-pct">${pct}% pravilno</div>
    ${mistakes.length ? `<div class="mistakes-block"><div class="mistakes-title">Napake:</div>${mistakes.map(m => `<div class="mistake-row"><span class="mistake-sl">${m.sl}</span><span class="mistake-arrow">→</span><span class="mistake-ru">${m.ru}</span></div>`).join("")}</div>` : ""}
    <div class="btn-row">
      <button class="btn-new words" onclick="startLesson()">Nova lekcija</button>
      <button class="btn-menu" onclick="goMenu()">Meni</button>
    </div>
  </div>`;
}

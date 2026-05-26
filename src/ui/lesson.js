import { state } from "../state.js";
import { genLesson } from "../engine/lesson.js";
import { app } from "./dom.js";

let _keyHandler = null;

function isCorrectAnswer(input, correct) {
  const norm = s => s.toLowerCase().replace(/č/g,"c").replace(/š/g,"s").replace(/ž/g,"z");
  return input.toLowerCase() === correct.toLowerCase() || norm(input) === norm(correct);
}

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
    inputValue: "",
    selected: null,
  };
  renderLesson();
}

export function renderLesson() {
  const { cards, current, score, checked, inputValue, selected } = state.ui;
  const c = cards[current];

  let bodyHTML = "";

  if (c.type === "choice") {
    const correct = c.sl;
    bodyHTML = `
      <div class="card words" style="margin-bottom:16px">
        <div class="card-label words">Rusko</div>
        <div class="card-word">${c.ru}</div>
        <div class="card-hint">${checked ? "" : "Izberi slovensko besedo:"}</div>
      </div>
      ${checked ? `<div style="background:#1a1a1a;border:1px solid ${selected === correct ? "rgba(52,211,153,.3)" : "rgba(252,165,165,.3)"};border-radius:10px;padding:12px;margin-bottom:12px;text-align:center">
        <div style="font-size:14px;color:${selected === correct ? "#6ee7b7" : "#fca5a5"}">${selected === correct ? "✓ Pravilno!" : "✗ Napačno"}</div>
        ${selected !== correct ? `<div style="font-size:18px;font-weight:600;color:#e8eaed">${correct}</div>` : ""}
      </div>
      <button class="btn-new words" style="width:100%;margin-top:4px" onclick="advanceLesson()">Naprej →</button>` : `
      <div class="options">${c.options.map((o, i) => {
        let cls = "opt-btn words";
        if (selected !== null) {
          if (o === correct) cls += " correct";
          else if (o === selected) cls += " wrong";
          else cls += " faded";
        }
        return `<button class="${cls}" ${selected !== null ? "disabled" : ""} onclick="selectLessonChoice(${i})">${o}</button>`;
      }).join("")}</div>`}`;

  } else if (c.type === "input") {
    bodyHTML = `
      <div class="card words" style="margin-bottom:16px">
        <div class="card-label words">Rusko</div>
        <div class="card-word">${c.ru}</div>
      </div>
      ${checked ? `
        <div style="background:#1a1a1a;border:1px solid ${isCorrectAnswer(inputValue, c.sl) ? "rgba(52,211,153,.3)" : "rgba(252,165,165,.3)"};border-radius:10px;padding:14px;margin-bottom:12px;text-align:center">
          <div style="font-size:14px;color:${isCorrectAnswer(inputValue, c.sl) ? "#6ee7b7" : "#fca5a5"}">${isCorrectAnswer(inputValue, c.sl) ? "✓ Pravilno!" : "✗ Napačno"}</div>
          ${!isCorrectAnswer(inputValue, c.sl) ? `<div style="font-size:18px;font-weight:600;color:#e8eaed">${c.sl}</div>` : ""}
        </div>
        <button class="btn-new words" style="width:100%" onclick="advanceLesson()">Naprej →</button>
      ` : `
        <input id="lesson-input" type="text"
          placeholder="Napiši v slovenščini..."
          style="width:100%;box-sizing:border-box;padding:14px;font-size:18px;border-radius:10px;border:1px solid rgba(255,255,255,.15);background:#1a1a1a;color:#e8eaed;outline:none;margin-bottom:8px"
          autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
        />
        <div style="display:flex;gap:6px;margin-bottom:10px">
          ${["č","š","ž","Č","Š","Ž"].map(l =>
            `<button onclick="document.getElementById('lesson-input').value+=('${l}');document.getElementById('lesson-input').focus()"
             style="padding:8px 12px;border:1px solid rgba(255,255,255,.15);background:#1a1a1a;color:#e8eaed;border-radius:8px;cursor:pointer;font-size:16px">${l}</button>`
          ).join("")}
        </div>
        <div style="display:flex;gap:8px">
          <button class="self-btn dont" onclick="skipLessonInput()" style="flex:1;padding:12px;border:none;border-radius:10px;background:rgba(252,165,165,.12);color:#fca5a5;font-weight:600;cursor:pointer;font-size:14px">✗ Ne vem</button>
          <button class="btn-new words" style="flex:2" onclick="checkLessonInput()">Preveri</button>
        </div>
      `}`;
    if (!checked) setTimeout(() => { const i = document.getElementById("lesson-input"); if (i) i.focus(); }, 50);

  } else if (c.type === "tiles") {
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
    bodyHTML = `
      <div class="sent-card"><div class="sent-label">Prevedi</div><div class="sent-ru">${c.ru}</div></div>
      <div class="answer-area">${answerHtml}</div>
      <div class="word-bank">${bankHtml}</div>
      ${c.checked
        ? `${!c.correct ? `<div style="text-align:center;margin:8px 0"><div style="color:#fca5a5;font-size:14px">Pravilen odgovor:</div><div class="sent-correct-answer">${c.sl.join(" ")}</div></div>` : ""}
           <button class="btn-check btn-next" onclick="advanceLesson()">Naprej →</button>`
        : `<button class="btn-check" ${c.answer.length === 0 ? "disabled" : ""} onclick="checkLessonTiles()">Preveri</button>`}`;
  }

  app().innerHTML = `<div>
    <div class="top-bar">
      <button onclick="${current > 0 ? 'goBackLesson()' : 'goMenu()'}" style="background:transparent;border:none;color:#888;cursor:pointer;font-size:20px;padding:0;line-height:1">←</button>
      <span class="progress-text">${current + 1}/${cards.length}</span>
      <span class="score-text score-words">✓ ${score}</span>
    </div>
    <div class="progress-track words"><div class="progress-fill words" style="width:${(current / cards.length) * 100}%"></div></div>
    ${bodyHTML}
  </div>`;
  if (_keyHandler) document.removeEventListener("keydown", _keyHandler);
  _keyHandler = (e) => {
    if (e.key !== "Enter") return;
    document.removeEventListener("keydown", _keyHandler);
    _keyHandler = null;
    const { checked } = state.ui;
    const card = state.ui.cards[state.ui.current];
    if (checked) {
      advanceLesson();
    } else if (card.type === "input") {
      checkLessonInput();
    } else if (card.type === "tiles" && card.answer.length > 0) {
      checkLessonTiles();
    }
  };
  setTimeout(() => document.addEventListener("keydown", _keyHandler), 100);
}

export function goBackLesson() {
  state.ui.current--;
  state.ui.checked = false;
  state.ui.inputValue = "";
  state.ui.selected = null;
  const c = state.ui.cards[state.ui.current];
  if (c.type === "tiles") { c.answer = []; c.checked = false; }
  renderLesson();
}

export function selectLessonChoice(i) {
  if (state.ui.selected !== null) return;
  const c = state.ui.cards[state.ui.current];
  state.ui.selected = c.options[i];
  const correct = state.ui.selected === c.sl;
  state.ui.checked = true;
  if (correct) state.ui.score++;
  else state.ui.mistakes.push({ sl: c.sl, ru: c.ru });
  renderLesson();
}

export function checkLessonInput() {
  const input = document.getElementById("lesson-input");
  const value = input ? input.value.trim() : "";
  const c = state.ui.cards[state.ui.current];
  const correct = isCorrectAnswer(value, c.sl);
  state.ui.checked = true;
  state.ui.inputValue = value;
  if (correct) state.ui.score++;
  else state.ui.mistakes.push({ sl: c.sl, ru: c.ru, given: value });
  renderLesson();
}

export function skipLessonInput() {
  const c = state.ui.cards[state.ui.current];
  state.ui.checked = true;
  state.ui.inputValue = "";
  state.ui.mistakes.push({ sl: c.sl, ru: c.ru, given: "" });
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
  c.correct = c.answer.join(" ") === c.sl.join(" ");
  if (c.correct) state.ui.score++;
  else state.ui.mistakes.push({ sl: c.sl.join(" "), ru: c.ru });
  renderLesson();
}

export function advanceLesson() {
  if (state.ui.current + 1 >= state.ui.cards.length) {
    renderLessonResult();
    return;
  }
  state.ui.current++;
  state.ui.checked = false;
  state.ui.inputValue = "";
  state.ui.selected = null;
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

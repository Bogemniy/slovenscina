import { state } from "../state.js";
import { genWritingQuiz } from "../engine/writing.js";
import { app } from "./dom.js";

function isCorrectAnswer(input, correct) {
  const norm = s => s.toLowerCase().replace(/č/g,"c").replace(/š/g,"s").replace(/ž/g,"z");
  return input.toLowerCase() === correct.toLowerCase() || norm(input) === norm(correct);
}

export function startWriting() {
  const cards = genWritingQuiz(10);
  state.ui = {
    mode: "writing-quiz",
    cards,
    current: 0,
    score: 0,
    mistakes: [],
    checked: false,
    inputValue: "",
  };
  renderWritingQuiz();
}

export function renderWritingQuiz() {
  const { cards, current, score, checked, inputValue } = state.ui;
  const c = cards[current];

  const isCorrect = checked && isCorrectAnswer(inputValue.trim(), c.sl);
  const isWrong = checked && !isCorrect;

  app().innerHTML = `<div>
    <div class="top-bar">
      <button onclick="goMenu()" style="background:transparent;border:none;color:#888;cursor:pointer;font-size:20px;padding:0;line-height:1">←</button>
      <span class="progress-text">${current + 1}/${cards.length}</span>
      <span class="score-text score-words">✓ ${score}</span>
    </div>
    <div class="progress-track words"><div class="progress-fill words" style="width:${(current / cards.length) * 100}%"></div></div>
    <div class="card words" style="margin-bottom:16px">
      <div class="card-label words">Rusko</div>
      <div class="card-word">${c.ru}</div>
    </div>
    ${checked ? `
      <div style="background:#1a1a1a;border:1px solid ${isCorrect ? "rgba(52,211,153,.3)" : "rgba(252,165,165,.3)"};border-radius:10px;padding:14px;margin-bottom:12px;text-align:center">
        <div style="font-size:14px;color:${isCorrect ? "#6ee7b7" : "#fca5a5"};margin-bottom:4px">${isCorrect ? "✓ Pravilno!" : "✗ Napačno"}</div>
        ${isWrong ? `<div style="font-size:18px;font-weight:600;color:#e8eaed">${c.sl}</div>` : ""}
      </div>
      <button class="btn-new words" style="width:100%" onclick="advanceWriting()">Naprej →</button>
    ` : `
      <input id="writing-input" type="text" value="${inputValue}"
        onkeydown="if(event.key==='Enter')checkWriting()"
        placeholder="Napiši v slovenščini..."
        style="width:100%;box-sizing:border-box;padding:14px;font-size:18px;border-radius:10px;border:1px solid rgba(255,255,255,.15);background:#1a1a1a;color:#e8eaed;outline:none;margin-bottom:8px"
        autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
      />
      <div style="display:flex;gap:6px;margin-bottom:10px">
        ${["č","š","ž","Č","Š","Ž"].map(l =>
          `<button onclick="document.getElementById('writing-input').value+=('${l}');document.getElementById('writing-input').focus()"
           style="padding:8px 12px;border:1px solid rgba(255,255,255,.15);background:#1a1a1a;color:#e8eaed;border-radius:8px;cursor:pointer;font-size:16px">${l}</button>`
        ).join("")}
      </div>
      <div style="display:flex;gap:8px;margin-top:4px">
        <button class="self-btn dont" onclick="skipWriting()" style="flex:1;padding:12px;border:none;border-radius:10px;background:rgba(252,165,165,.12);color:#fca5a5;font-weight:600;cursor:pointer;font-size:14px">✗ Ne vem</button>
        <button class="btn-new words" style="flex:2" onclick="checkWriting()">Preveri</button>
      </div>
    `}
  </div>`;

  if (!checked) {
    setTimeout(() => {
      const input = document.getElementById("writing-input");
      if (input) input.focus();
    }, 50);
  }
  setTimeout(() => {
    const handler = (e) => {
      if (e.key !== "Enter") return;
      document.removeEventListener("keydown", handler);
      if (state.ui.checked) {
        advanceWriting();
      } else {
        checkWriting();
      }
    };
    document.addEventListener("keydown", handler);
  }, 100);
}

export function checkWriting() {
  const input = document.getElementById("writing-input");
  const value = input ? input.value.trim() : "";
  const c = state.ui.cards[state.ui.current];
  const correct = value !== "" && isCorrectAnswer(value, c.sl);
  state.ui.checked = true;
  state.ui.inputValue = value;
  if (correct) {
    state.ui.score++;
  } else {
    state.ui.mistakes.push({ sl: c.sl, ru: c.ru, given: value });
  }
  renderWritingQuiz();
}

export function skipWriting() {
  const c = state.ui.cards[state.ui.current];
  state.ui.checked = true;
  state.ui.inputValue = "";
  state.ui.mistakes.push({ sl: c.sl, ru: c.ru, given: "" });
  renderWritingQuiz();
}

export function advanceWriting() {
  if (state.ui.current + 1 >= state.ui.cards.length) {
    renderWritingResult();
    return;
  }
  state.ui.current++;
  state.ui.checked = false;
  state.ui.inputValue = "";
  renderWritingQuiz();
}

function renderWritingResult() {
  const { cards, score, mistakes } = state.ui;
  const pct = Math.round((score / cards.length) * 100);
  const emoji = pct === 100 ? "🏆" : pct >= 80 ? "🌟" : pct >= 60 ? "👍" : "💪";
  app().innerHTML = `<div class="result-card words">
    <div class="result-emoji">${emoji}</div>
    <div class="result-title">Runda končana!</div>
    <div class="result-score words">${score}/${cards.length}</div>
    <div class="result-pct">${pct}% pravilno</div>
    ${mistakes.length ? `<div class="mistakes-block"><div class="mistakes-title">Napake:</div>${mistakes.map((m) => `
      <div class="mistake-row">
        <span class="mistake-sl">${m.sl}</span>
        <span class="mistake-arrow">→</span>
        <span class="mistake-ru">${m.ru}</span>
        <span style="color:#fca5a5;font-size:12px">(napisal/a: ${m.given})</span>
      </div>`).join("")}</div>` : ""}
    <div class="btn-row">
      <button class="btn-new words" onclick="startWriting()">Še runda</button>
      <button class="btn-menu" onclick="goMenu()">Meni</button>
    </div>
  </div>`;
}

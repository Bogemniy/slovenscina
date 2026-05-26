import { state, shuffle } from "../state.js";
import { getExercise, getExerciseCount } from "../engine/reading.js";
import { app } from "./dom.js";

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function startReading() {
  state.ui = { mode: "reading-menu" };
  renderReadingMenu();
}

export function renderReadingMenu() {
  const count = getExerciseCount();
  app().innerHTML = `<div class="menu-card">
    <div class="menu-flag">📖</div>
    <div class="menu-title" style="font-size:24px">Branje in razumevanje</div>
    <div class="menu-sub" style="margin-bottom:18px">${count} besedil · nivo A2</div>
    <button class="menu-btn reading-btn" onclick="startReadingOrdered()">📋 Vse po vrsti</button>
    <button class="menu-btn reading-btn" onclick="startReadingRandom()">🎲 Naključno</button>
    <button class="btn-menu" onclick="goMenu()" style="margin-top:14px">← Glavni meni</button>
  </div>`;
}

function launchPlaylist(playlist, pos, playlistMode) {
  const idx = playlist[pos];
  const exercise = getExercise(idx);
  if (!exercise) return;
  const blanks = exercise.blanks.map((b) => ({ ...b, shuffledOptions: shuffle(b.options) }));
  state.ui = {
    mode: "reading-quiz",
    exerciseIdx: idx,
    exercise: { ...exercise, blanks },
    phase: "blanks",
    blankIdx: 0,
    blankAnswers: [],
    questionIdx: 0,
    questionAnswers: [],
    selectedOption: null,
    blankScore: 0,
    questionScore: 0,
    playlist,
    playlistPos: pos,
    playlistMode,
  };
  renderReadingQuiz();
}

export function startReadingOrdered() {
  const count = getExerciseCount();
  launchPlaylist(Array.from({ length: count }, (_, i) => i), 0, "ordered");
}

export function startReadingRandom() {
  const count = getExerciseCount();
  launchPlaylist(shuffle(Array.from({ length: count }, (_, i) => i)), 0, "random");
}

export function startReadingExercise(idx) {
  const { playlist, playlistPos, playlistMode } = state.ui || {};
  const exercise = getExercise(idx);
  if (!exercise) return;
  const blanks = exercise.blanks.map((b) => ({ ...b, shuffledOptions: shuffle(b.options) }));
  state.ui = {
    mode: "reading-quiz",
    exerciseIdx: idx,
    exercise: { ...exercise, blanks },
    phase: "blanks",
    blankIdx: 0,
    blankAnswers: [],
    questionIdx: 0,
    questionAnswers: [],
    selectedOption: null,
    blankScore: 0,
    questionScore: 0,
    playlist: playlist || null,
    playlistPos: playlistPos ?? 0,
    playlistMode: playlistMode || null,
  };
  renderReadingQuiz();
}

function renderTextWithBlanks() {
  const { exercise, blankAnswers, blankIdx } = state.ui;
  const parts = exercise.text.split("___");
  let html = "";
  for (let i = 0; i < parts.length; i++) {
    html += esc(parts[i]).replace(/\n/g, "<br>");
    if (i < parts.length - 1) {
      const answered = blankAnswers[i];
      if (answered !== undefined) {
        const cls = answered.correct ? "blank-correct" : "blank-wrong";
        html += `<span class="blank-chip ${cls}">${esc(answered.selected)}</span>`;
      } else if (i === blankIdx) {
        html += `<span class="blank-chip blank-active">___</span>`;
      } else {
        html += `<span class="blank-chip blank-empty">___</span>`;
      }
    }
  }
  return html;
}

export function renderReadingQuiz() {
  const { exercise, phase, blankIdx, blankAnswers, questionIdx, questionAnswers, blankScore, questionScore, selectedOption } = state.ui;
  if (phase === "result") { renderReadingResult(); return; }

  const totalBlanks = exercise.blanks.length;
  const totalQ = exercise.questions ? exercise.questions.length : 0;
  const total = totalBlanks + totalQ;
  const done = blankAnswers.length + questionAnswers.length;
  const score = blankScore + questionScore;

  let bodyHTML = "";
  if (phase === "blanks") {
    const blank = exercise.blanks[blankIdx];
    bodyHTML = `
      <div class="card reading-card">
        <div class="card-label reading-label">Dopolni besedilo</div>
        <div style="line-height:1.9;font-size:15px;color:#e8eaed">${renderTextWithBlanks()}</div>
      </div>
      <div style="font-size:12px;color:#777;margin-bottom:10px;text-align:center">Prazno ${blankIdx + 1}/${totalBlanks}</div>
      <div class="options">${blank.shuffledOptions.map((o, i) => {
        let cls = "opt-btn reading";
        if (selectedOption !== null) {
          if (o === blank.answer) cls += " correct";
          else if (o === selectedOption) cls += " wrong";
          else cls += " faded";
        }
        return `<button class="${cls}" ${selectedOption !== null ? "disabled" : ""} onclick="selectBlankOption(${i})">${esc(o)}</button>`;
      }).join("")}</div>`;
  } else {
    const q = exercise.questions[questionIdx];
    bodyHTML = `
      <div class="card reading-card">
        <div class="card-label reading-label">Vprašanje ${questionIdx + 1}/${totalQ}</div>
        <div style="font-size:20px;font-weight:700;color:#fff;line-height:1.4">${esc(q.question)}</div>
      </div>
      <div class="options">${q.options.map((o, i) => {
        let cls = "opt-btn reading";
        if (selectedOption !== null) {
          if (i === q.answer) cls += " correct";
          else if (i === selectedOption) cls += " wrong";
          else cls += " faded";
        }
        return `<button class="${cls}" ${selectedOption !== null ? "disabled" : ""} onclick="selectQuestionOption(${i})">${esc(o)}</button>`;
      }).join("")}</div>`;
  }

  app().innerHTML = `<div>
    <div class="top-bar">
      <button onclick="startReading()" style="background:transparent;border:none;color:#888;cursor:pointer;font-size:20px;padding:0;line-height:1">←</button>
      <span class="progress-text" style="font-size:13px;max-width:70%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${exercise.unit !== "screen" ? "Enota " + esc(exercise.unit) + " · " : ""}${esc(exercise.title)}</span>
      <span class="score-text" style="color:#fcd34d">✓ ${score}</span>
    </div>
    <div class="progress-track reading"><div class="progress-fill reading" style="width:${(done / total) * 100}%"></div></div>
    ${bodyHTML}
  </div>`;
}

export function selectBlankOption(i) {
  if (state.ui.selectedOption !== null) return;
  const { exercise, blankIdx, blankAnswers } = state.ui;
  const blank = exercise.blanks[blankIdx];
  const selected = blank.shuffledOptions[i];
  const correct = selected === blank.answer;
  state.ui.selectedOption = selected;
  if (correct) state.ui.blankScore++;
  renderReadingQuiz();
  setTimeout(() => {
    state.ui.blankAnswers = [...blankAnswers, { selected, correct }];
    state.ui.selectedOption = null;
    if (blankIdx + 1 >= exercise.blanks.length) {
      state.ui.phase = exercise.questions && exercise.questions.length > 0 ? "questions" : "result";
      state.ui.questionIdx = 0;
    } else {
      state.ui.blankIdx++;
    }
    renderReadingQuiz();
  }, 900);
}

export function selectQuestionOption(i) {
  if (state.ui.selectedOption !== null) return;
  const { exercise, questionIdx, questionAnswers } = state.ui;
  const q = exercise.questions[questionIdx];
  const correct = i === q.answer;
  state.ui.selectedOption = i;
  if (correct) state.ui.questionScore++;
  renderReadingQuiz();
  setTimeout(() => {
    state.ui.questionAnswers = [...questionAnswers, { selected: i, correct }];
    state.ui.selectedOption = null;
    if (questionIdx + 1 >= exercise.questions.length) {
      state.ui.phase = "result";
    } else {
      state.ui.questionIdx++;
    }
    renderReadingQuiz();
  }, 900);
}

export function renderReadingResult() {
  const { exercise, exerciseIdx, blankScore, questionScore, blankAnswers } = state.ui;
  const total = exercise.blanks.length + (exercise.questions ? exercise.questions.length : 0);
  const score = blankScore + questionScore;
  const pct = Math.round((score / total) * 100);
  const emoji = pct === 100 ? "🏆" : pct >= 80 ? "🌟" : pct >= 60 ? "👍" : "💪";

  const blankMistakes = exercise.blanks
    .map((b, i) => (blankAnswers[i] && !blankAnswers[i].correct ? { answer: b.answer, selected: blankAnswers[i].selected } : null))
    .filter(Boolean);

  const mistakesHTML = blankMistakes.length
    ? `<div class="mistakes-block"><div class="mistakes-title">Pravilni odgovori:</div>${blankMistakes
        .map((m) => `<div class="mistake-row"><span class="mistake-sl">${esc(m.selected)}</span><span class="mistake-arrow">→</span><span style="color:#fcd34d;font-weight:600">${esc(m.answer)}</span></div>`)
        .join("")}</div>`
    : "";

  const nextIdx = (exerciseIdx + 1) % state.EXERCISES.length;

  app().innerHTML = `<div class="result-card reading-result">
    <div class="result-emoji">${emoji}</div>
    <div class="result-title">${esc(exercise.title)}</div>
    <div class="result-score" style="background:linear-gradient(135deg,#fcd34d,#f59e0b);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">${score}/${total}</div>
    <div class="result-pct">${pct}% pravilno</div>
    ${mistakesHTML}
    <div class="btn-row">
      <button class="btn-new reading-btn-solid" onclick="startReadingExercise(${exerciseIdx})">Ponovi</button>
      <button class="btn-new reading-btn-solid" onclick="nextExercise()">Naslednje →</button>
      <button class="btn-menu" onclick="startReading()">Seznam</button>
      <button class="btn-menu" onclick="goMenu()">Meni</button>
    </div>
  </div>`;
}

export function nextExercise() {
  const { playlist, playlistPos, playlistMode } = state.ui;
  if (playlist && playlistPos + 1 < playlist.length) {
    launchPlaylist(playlist, playlistPos + 1, playlistMode);
  } else if (playlist) {
    launchPlaylist(playlist, 0, playlistMode);
  } else {
    startReadingExercise((state.ui.exerciseIdx + 1) % getExerciseCount());
  }
}

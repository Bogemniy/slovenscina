import { state } from "../state.js";
import { genSentQuiz } from "../engine/sentences.js";
import { app } from "./dom.js";

export function startSents() {
  state.ui = { mode: "sents-quiz", cards: genSentQuiz(8), current: 0, score: 0, mistakes: [] };
  renderSentQuiz();
}

export function renderSentQuiz() {
  const { cards, current, score } = state.ui;
  const c = cards[current];

  let answerHtml = "";
  if (c.answer.length === 0) answerHtml = '<span style="color:#3a5a3a;font-size:14px">Нажми на слова ниже</span>';
  else
    c.answer.forEach((w, i) => {
      let cls = "tile";
      if (c.checked) {
        if (c.correct) cls += " correct-tile";
        else if (i < c.sl.length && w === c.sl[i]) cls += " correct-tile";
        else cls += " wrong-tile";
      }
      const click = c.checked ? "" : "removeTile(" + i + ")";
      answerHtml += '<span class="' + cls + '" onclick="' + click + '">' + w + "</span>";
    });

  const usedIdxs = [];
  c.answer.forEach((aw) => {
    for (let ti = 0; ti < c.tiles.length; ti++) {
      if (c.tiles[ti] === aw && usedIdxs.indexOf(ti) === -1) {
        usedIdxs.push(ti);
        break;
      }
    }
  });

  let bankHtml = "";
  c.tiles.forEach((w, i) => {
    const isUsed = usedIdxs.indexOf(i) >= 0;
    let cls = "tile";
    if (isUsed) cls += " used";
    const click = c.checked || isUsed ? "" : "addTile(" + i + ")";
    bankHtml += '<span class="' + cls + '" onclick="' + click + '">' + w + "</span>";
  });

  let bottomHtml = "";
  if (c.checked) {
    if (c.correct) bottomHtml = '<div style="text-align:center"><div style="color:#66bb6a;font-size:18px;font-weight:700;margin:12px 0">Правильно! ✓</div></div>';
    else
      bottomHtml = '<div style="text-align:center"><div style="color:#ff6b6b;font-size:16px;margin:8px 0">Правильный ответ:</div><div class="sent-correct-answer">' + c.sl.join(" ") + "</div></div>";
    bottomHtml += '<button class="btn-check btn-next" onclick="nextSent()">Далее →</button>';
  } else {
    const dis = c.answer.length === 0 ? "disabled" : "";
    bottomHtml = '<button class="btn-check" ' + dis + ' onclick="checkSent()">Проверить</button>';
  }

  app().innerHTML =
    "<div>" +
    '<div class="top-bar"><span class="progress-text">' +
    (current + 1) +
    "/" +
    cards.length +
    '</span><span class="score-text score-sents">✓ ' +
    score +
    "</span></div>" +
    '<div class="progress-track sents"><div class="progress-fill sents" style="width:' +
    (current / cards.length) * 100 +
    '%"></div></div>' +
    '<div class="sent-card"><div class="sent-label">Переведи</div><div class="sent-ru">' +
    c.ru +
    "</div></div>" +
    '<div class="answer-area">' +
    answerHtml +
    "</div>" +
    '<div class="word-bank">' +
    bankHtml +
    "</div>" +
    bottomHtml +
    "</div>";
}

export function addTile(bankIdx) {
  const c = state.ui.cards[state.ui.current];
  if (c.checked) return;
  c.answer.push(c.tiles[bankIdx]);
  renderSentQuiz();
}

export function removeTile(ansIdx) {
  const c = state.ui.cards[state.ui.current];
  if (c.checked) return;
  c.answer.splice(ansIdx, 1);
  renderSentQuiz();
}

export function checkSent() {
  const c = state.ui.cards[state.ui.current];
  c.checked = true;
  c.correct = c.answer.join(" ") === c.sl.join(" ");
  if (c.correct) state.ui.score++;
  else state.ui.mistakes.push({ ru: c.ru, correct: c.sl.join(" "), given: c.answer.join(" ") });
  renderSentQuiz();
}

export function nextSent() {
  if (state.ui.current + 1 >= state.ui.cards.length) {
    renderSentResult();
    return;
  }
  state.ui.current++;
  renderSentQuiz();
}

function renderSentResult() {
  const { cards, score, mistakes } = state.ui;
  const pct = Math.round((score / cards.length) * 100);
  const emoji = pct === 100 ? "🏆" : pct >= 80 ? "🌟" : pct >= 60 ? "👍" : "💪";
  let mistakesHtml = "";
  if (mistakes.length) {
    mistakesHtml = '<div class="mistakes-block"><div class="mistakes-title">Повтори:</div>';
    mistakes.forEach((m) => {
      mistakesHtml +=
        '<div class="mistake-row" style="flex-direction:column;gap:4px"><span style="color:#5a7a5a;font-size:13px">' +
        m.ru +
        '</span><span style="color:#66bb6a;font-weight:600">' +
        m.correct +
        "</span></div>";
    });
    mistakesHtml += "</div>";
  }
  app().innerHTML =
    '<div class="result-card sents">' +
    '<div class="result-emoji">' +
    emoji +
    '</div><div class="result-title">Раунд окончен!</div>' +
    '<div class="result-score sents">' +
    score +
    "/" +
    cards.length +
    '</div><div class="result-pct">' +
    pct +
    "% правильно</div>" +
    mistakesHtml +
    '<div class="btn-row"><button class="btn-new sents" onclick="startSents()">Новый раунд</button><button class="btn-menu" onclick="goMenu()">Меню</button></div>' +
    "</div>";
}

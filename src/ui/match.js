import { state } from "../state.js";
import { genMatchRound } from "../engine/match.js";
import { app } from "./dom.js";

export function startMatch() {
  state.ui = { mode: "match", rounds: [], current: 0, totalScore: 0, totalMistakes: 0 };
  for (let i = 0; i < 6; i++) state.ui.rounds.push(genMatchRound());
  renderMatch();
}

export function renderMatch() {
  const round = state.ui.rounds[state.ui.current];
  const allMatched = round.pairs.every((p) => p.matched);

  let leftHtml = "";
  round.slOrder.forEach((pi) => {
    const p = round.pairs[pi];
    let cls = "match-tile sl";
    if (p.matched) cls += " correct-match";
    else if (state.ui.selectedSl === pi) cls += " selected";
    if (round.wrongPair && round.wrongPair.sl === pi && !p.matched) cls += " wrong-match";
    leftHtml += '<div class="' + cls + '" onclick="pickSl(' + pi + ')">' + p.sl + "</div>";
  });

  let rightHtml = "";
  round.ruOrder.forEach((pi) => {
    const p = round.pairs[pi];
    let cls = "match-tile ru";
    if (p.matched) cls += " correct-match";
    else if (state.ui.selectedRu === pi) cls += " selected";
    if (round.wrongPair && round.wrongPair.ru === pi && !p.matched) cls += " wrong-match";
    rightHtml += '<div class="' + cls + '" onclick="pickRu(' + pi + ')">' + p.ru + "</div>";
  });

  app().innerHTML =
    "<div>" +
    '<div class="top-bar"><span class="progress-text">' +
    (state.ui.current + 1) +
    "/" +
    state.ui.rounds.length +
    '</span><span class="score-text score-match">✓ ' +
    state.ui.totalScore +
    "</span></div>" +
    '<div class="progress-track match"><div class="progress-fill match" style="width:' +
    (state.ui.current / state.ui.rounds.length) * 100 +
    '%"></div></div>' +
    '<div class="match-round">Соедини пары</div>' +
    '<div class="match-cols"><div class="match-col">' +
    leftHtml +
    '</div><div class="match-col">' +
    rightHtml +
    "</div></div>" +
    (allMatched
      ? '<button class="btn-check btn-next" style="margin-top:20px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#0f1923" onclick="nextMatchRound()">Далее →</button>'
      : "") +
    "</div>";
}

export function pickSl(i) {
  const round = state.ui.rounds[state.ui.current];
  if (round.pairs[i].matched) return;
  round.wrongPair = null;
  state.ui.selectedSl = i;
  if (state.ui.selectedRu !== null) checkMatch();
  else renderMatch();
}

export function pickRu(i) {
  const round = state.ui.rounds[state.ui.current];
  if (round.pairs[i].matched) return;
  round.wrongPair = null;
  state.ui.selectedRu = i;
  if (state.ui.selectedSl !== null) checkMatch();
  else renderMatch();
}

function checkMatch() {
  const round = state.ui.rounds[state.ui.current];
  const si = state.ui.selectedSl;
  const ri = state.ui.selectedRu;
  if (si === ri) {
    round.pairs[si].matched = true;
    state.ui.totalScore++;
    state.ui.selectedSl = null;
    state.ui.selectedRu = null;
    renderMatch();
  } else {
    round.wrongPair = { sl: si, ru: ri };
    round.mistakes++;
    state.ui.totalMistakes++;
    renderMatch();
    setTimeout(() => {
      round.wrongPair = null;
      state.ui.selectedSl = null;
      state.ui.selectedRu = null;
      renderMatch();
    }, 800);
  }
}

export function nextMatchRound() {
  if (state.ui.current + 1 >= state.ui.rounds.length) {
    renderMatchResult();
    return;
  }
  state.ui.current++;
  state.ui.selectedSl = null;
  state.ui.selectedRu = null;
  renderMatch();
}

function renderMatchResult() {
  const total = state.ui.rounds.length * 5;
  const emoji = state.ui.totalMistakes === 0 ? "🏆" : state.ui.totalMistakes <= 3 ? "🌟" : state.ui.totalMistakes <= 6 ? "👍" : "💪";
  app().innerHTML =
    '<div class="result-card match">' +
    '<div class="result-emoji">' +
    emoji +
    '</div><div class="result-title">Раунд окончен!</div>' +
    '<div class="result-score match">' +
    state.ui.totalScore +
    "/" +
    total +
    "</div>" +
    '<div class="result-pct">Ошибок: ' +
    state.ui.totalMistakes +
    "</div>" +
    '<div class="btn-row" style="margin-top:20px">' +
    '<button class="btn-new match" onclick="startMatch()">Новый раунд</button>' +
    '<button class="btn-menu" onclick="goMenu()">Меню</button>' +
    "</div></div>";
}

import { state, bucketWords, shuffle, loadWordQueue, loadVerbQueue, loadWordProgress } from "../state.js";
import { app } from "./dom.js";

export function renderMenu() {
  const b = bucketWords();
  app().innerHTML = `<div class="menu-card">
    <div class="menu-flag">🇸🇮</div>
    <div class="menu-title">Slovenščina</div>
    <div class="menu-sub">${state.WORDS.length} слов · ${state.VERBS.length} глаголов · ${state.SENTENCES.length} предложений</div>
    <button class="menu-btn words" onclick="startWords()">📝 Карточки слов</button>
    <button class="menu-btn verbs" onclick="startVerbs()">🔤 Карточки глаголов</button>
    <button class="menu-btn sents" onclick="startSents()">🧩 Составь предложение</button>
    <button class="menu-btn match" onclick="startMatch()">🔗 Соотнеси слова</button>
    <div class="divider"></div>
    <button class="menu-btn table-btn" onclick="showVerbList()">📖 Таблицы спряжений</button>
    <div class="divider"></div>
    <div style="font-size:12px;color:#5a7a94;margin-bottom:8px">Слова: учу ${b.learning.length} · к повтору ${b.due.length} · знаю ${b.mastered.length} · новых ${b.new.length}</div>
    <div style="font-size:11px;color:#7a8a98;margin-bottom:8px">Глаголы: ${state.verbsSeen}/${state.VERBS.length * 9}</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap">
      <button class="menu-btn table-btn" style="font-size:12px;padding:8px;flex:1;min-width:90px" onclick="exportProgress()">📤 Экспорт</button>
      <button class="menu-btn table-btn" style="font-size:12px;padding:8px;flex:1;min-width:90px" onclick="importProgress()">📥 Импорт</button>
      <button class="menu-btn table-btn" style="font-size:12px;padding:8px;flex:1;min-width:90px" onclick="resetProgress()">🔄 Сброс</button>
    </div>
  </div>`;
}

export function goMenu() {
  state.ui = { mode: "menu" };
  renderMenu();
}

export function resetProgress() {
  if (!confirm("Сбросить весь прогресс? Это удалит уровни знания всех слов и истории очередей.")) return;
  try {
    localStorage.removeItem("wq");
    localStorage.removeItem("vq");
    localStorage.removeItem("wp");
  } catch {}
  state.wordQueue = shuffle([...state.WORDS]);
  state.wordsSeen = 0;
  state.wordProgress = {};
  const combos = [];
  for (const v of state.VERBS) for (const p of state.PRONOUNS) combos.push({ verb: v, pronoun: p });
  state.verbQueue = shuffle(combos);
  state.verbsSeen = 0;
  renderMenu();
}

export function exportProgress() {
  try {
    const wq = localStorage.getItem("wq") || "";
    const vq = localStorage.getItem("vq") || "";
    const wp = localStorage.getItem("wp") || "";
    const data = { wq, vq, wp, wordsSeen: state.wordsSeen, verbsSeen: state.verbsSeen, date: new Date().toISOString() };
    const json = JSON.stringify(data);
    const dt = new Date().toISOString().slice(0, 10);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `slo-progress-${dt}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(json).then(
        () => alert("✓ Прогресс сохранён в файл и скопирован в буфер."),
        () => alert("✓ Прогресс сохранён в файл.")
      );
    } else {
      alert("✓ Прогресс сохранён в файл.");
    }
  } catch (e) {
    alert("Ошибка экспорта: " + e.message);
  }
}

export function importProgress() {
  const txt = prompt("Вставь сюда экспортированный прогресс (JSON):");
  if (!txt) return;
  try {
    const data = JSON.parse(txt.trim());
    if (data.wq) localStorage.setItem("wq", data.wq);
    if (data.vq) localStorage.setItem("vq", data.vq);
    if (data.wp) localStorage.setItem("wp", data.wp);
    loadWordProgress();
    loadWordQueue();
    loadVerbQueue();
    renderMenu();
    const learned = Object.values(state.wordProgress).filter((p) => p.level >= 1).length;
    alert(
      "✓ Прогресс восстановлен!\nСлова: " +
        state.wordsSeen +
        "/" +
        state.WORDS.length +
        "\nГлаголы: " +
        state.verbsSeen +
        "/" +
        state.VERBS.length * 9 +
        "\nВ работе: " +
        learned
    );
  } catch (e) {
    alert("Ошибка импорта: " + e.message + "\n\nПроверь, что вставил корректный JSON.");
  }
}

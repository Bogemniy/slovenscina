import { state } from "../state.js";
import { app } from "./dom.js";

const TOPIC_GROUPS = [
  { label: "🗣️ Sporazumevanje", cats: ["greet", "phrase", "question"] },
  { label: "👨‍👩‍👧 Ljudje in družina", cats: ["people", "family", "pron"] },
  { label: "🏠 Dom in kraj", cats: ["home", "where", "goplace"] },
  { label: "🍕 Hrana in nakupovanje", cats: ["food", "shop"] },
  { label: "💼 Delo in šola", cats: ["job", "school", "info"] },
  { label: "⏰ Čas in letni časi", cats: ["time", "season"] },
  { label: "🌤️ Narava in vreme", cats: ["weather"] },
  { label: "🏃 Dejanja", cats: ["verb", "daily", "activity"] },
  { label: "💬 Opisi", cats: ["adj", "color", "feel", "body"] },
  { label: "🚗 Prevoz", cats: ["transport"] },
  { label: "🔢 Števila in ostalo", cats: ["number", "thing"] },
];

export function showProgress() {
  const rows = TOPIC_GROUPS.map(({ label, cats }) => {
    const words = state.LEARN.filter(w => cats.includes(w.cat));
    const total = words.length;
    const learned = words.filter(w => {
      const p = state.learnProgress[w.sl];
      return p && p.level >= 5;
    }).length;
    const pct = total === 0 ? 0 : Math.round((learned / total) * 100);

    return `<div style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px">
        <span style="font-size:14px;color:#e8eaed">${label}</span>
        <span style="font-size:12px;color:#888">${learned}/${total}</span>
      </div>
      <div style="background:rgba(255,255,255,.08);border-radius:6px;height:8px;overflow:hidden">
        <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#6ee7b7,#34d399);border-radius:6px;transition:width .3s"></div>
      </div>
    </div>`;
  }).join("");

  const totalWords = state.LEARN.length;
  const totalLearned = state.LEARN.filter(w => {
    const p = state.learnProgress[w.sl];
    return p && p.level >= 5;
  }).length;
  const totalPct = Math.round((totalLearned / totalWords) * 100);

  app().innerHTML = `<div class="menu-card">
    <button class="back-btn" onclick="goMenu()">← Meni</button>
    <div style="font-size:20px;font-weight:700;margin-bottom:4px">Moj napredek</div>
    <div style="font-size:13px;color:#888;margin-bottom:16px">Skupaj: ${totalLearned}/${totalWords} besed (${totalPct}%)</div>
    ${rows}
  </div>`;
}

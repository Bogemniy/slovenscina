import { state } from "../state.js";
import { app } from "./dom.js";

export function showBesednjak() {
  const words = state.LEARN.filter(w => w.cat !== "verb");

  app().innerHTML = `<div class="table-card">
    <button class="back-btn" onclick="goMenu()">← Meni</button>
    <div style="font-size:20px;font-weight:700;margin-bottom:12px">Besednjak</div>
    <input id="besednjak-search" type="text"
      oninput="filterBesednjak(this.value)"
      placeholder="Išči besedo..."
      style="width:100%;box-sizing:border-box;padding:10px 14px;font-size:15px;border-radius:10px;border:1px solid rgba(255,255,255,.15);background:#1a1a1a;color:#e8eaed;outline:none;margin-bottom:12px"
      autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
    />
    <div id="besednjak-content">${buildGrouped(words)}</div>
  </div>`;
}

export function filterBesednjak(query) {
  const words = state.LEARN.filter(w => w.cat !== "verb");
  const content = document.getElementById("besednjak-content");
  if (!content) return;
  const q = query.trim().toLowerCase();
  content.innerHTML = q ? buildSearchResults(words, q) : buildGrouped(words);
}

const CAT_LABELS = {
  greet: "👋 Pozdravi",
  phrase: "💬 Fraze",
  people: "👥 Ljudje",
  family: "👨‍👩‍👧 Družina",
  job: "💼 Poklici",
  info: "📋 Osebne informacije",
  school: "📖 Šola",
  education: "🎓 Izobraževanje",
  time: "⏰ Čas",
  season: "🌸 Letni časi",
  weather: "🌤️ Vreme",
  food: "🍕 Hrana",
  home: "🏠 Dom",
  shop: "🛒 Nakupovanje",
  transport: "🚗 Prevoz",
  place: "🗺️ Kraji",
  where: "📌 Kje",
  daily: "☀️ Vsakdan",
  goplace: "🚶 Kam grem",
  body: "🫀 Telo",
  feel: "😊 Čustva",
  color: "🎨 Barve",
  animal: "🐾 Živali",
  sport: "⚽ Šport",
  activity: "🏃 Aktivnosti",
  instrument: "🎸 Glasbila",
  number: "🔢 Števila",
  month: "📅 Meseci",
  pron: "👤 Zaimki",
  question: "❓ Vprašalnice",
  adverb: "📍 Prislovi",
  noun: "📚 Samostalniki",
  thing: "🧩 Stvari",
  adj: "✨ Pridevniki",
};

function wordRow(w) {
  return `<div style="padding:6px 0;border-bottom:1px solid rgba(255,255,255,.05);font-size:14px">
    <span style="color:#e8eaed">${w.sl}</span>
    <span style="color:#666;margin:0 6px">—</span>
    <span style="color:#aaa">${w.ru}</span>
  </div>`;
}

function buildGrouped(words) {
  const grouped = {};
  for (const w of words) {
    if (!grouped[w.cat]) grouped[w.cat] = [];
    grouped[w.cat].push(w);
  }
  return Object.entries(CAT_LABELS).map(([cat, label]) => {
    const catWords = grouped[cat];
    if (!catWords || catWords.length === 0) return "";
    const id = `bg-${cat}`;
    return `<div style="margin-bottom:8px;border:1px solid rgba(255,255,255,.08);border-radius:10px;overflow:hidden">
      <div onclick="(function(el){var c=document.getElementById('${id}');c.style.display=c.style.display==='none'?'block':'none';el.querySelector('.acc-arrow').textContent=c.style.display==='none'?'▶':'▼'})(this)"
        style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;cursor:pointer;background:#1a1a1a;font-weight:600;font-size:14px">
        <span>${label} <span style="font-size:12px;opacity:.6">(${catWords.length})</span></span>
        <span class="acc-arrow">▶</span>
      </div>
      <div id="${id}" style="display:none;padding:10px 14px;max-height:300px;overflow-y:auto">
        ${catWords.map(wordRow).join("")}
      </div>
    </div>`;
  }).join("");
}

function buildSearchResults(words, q) {
  const matches = words.filter(w =>
    w.sl.toLowerCase().includes(q) || w.ru.toLowerCase().includes(q)
  );
  if (matches.length === 0) return '<div style="text-align:center;color:#777;padding:20px">Ni rezultatov</div>';
  return `<div style="padding:0 4px">${matches.map(wordRow).join("")}</div>`;
}

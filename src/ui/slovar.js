import { state } from "../state.js";
import { app } from "./dom.js";

let _filter = "all"; // "all" | "words" | "verbs"
let _query = "";
let _openVerb = -1;       // index in state.VERBS, -1 = none open
let _openGroups = new Set(); // cat keys (+ "verbs") that are expanded

function norm(s) {
  return s.toLowerCase()
    .replace(/č/g, "c").replace(/š/g, "s").replace(/ž/g, "z");
}

function matchWord(w, q) {
  return norm(w.sl).includes(q) || norm(w.ru).includes(q);
}

function matchVerb(v, q) {
  const fields = [v.inf, v.ru,
    ...Object.values(v.forms || {}),
    ...Object.values(v.past || {}),
    ...Object.values(v.future || {}),
  ];
  return fields.some(f => f && norm(f).includes(q));
}

function verbPreview(v) {
  const jaz = state.PRONOUNS ? state.PRONOUNS[0] : "jaz";
  const pres = v.forms ? (v.forms[jaz] || "") : "";
  const past = v.past ? (v.past[jaz] || "") : "";
  const fut = v.future ? (v.future[jaz] || "") : "";
  return [pres, past, fut].filter(Boolean).join(" · ");
}

// Shorten "sem počival/počivala" → "sem počival/-a" only when stem is identical.
// Irregular participles (šel/šla, jedel/jedla) stay full.
function abbreviateForms(form) {
  if (!form || !form.includes("/")) return form;
  const slashParts = form.split("/");
  const firstPart = slashParts[0];
  const lastSpace = firstPart.lastIndexOf(" ");
  const prefix = lastSpace >= 0 ? firstPart.slice(0, lastSpace + 1) : "";
  const base = lastSpace >= 0 ? firstPart.slice(lastSpace + 1) : firstPart;
  const out = [base];
  for (let k = 1; k < slashParts.length; k++) {
    const next = slashParts[k];
    // Find actual longest common prefix between base and next.
    let commonLen = 0;
    while (commonLen < base.length && commonLen < next.length && base[commonLen] === next[commonLen]) {
      commonLen++;
    }
    // Abbreviate only when base and next share at least (base.length - 1) chars,
    // meaning they diverge only at the very end (feminine/neuter ending swap).
    // Irregulars like šel/šla diverge much earlier → kept full.
    if (commonLen >= base.length - 1) {
      out.push("-" + next.slice(commonLen));
    } else {
      out.push(next);
    }
  }
  return prefix + out.join("/");
}

// Vertical layout: 3 tense blocks stacked, guaranteed to fit on narrow screens.
function verbTableHTML(v) {
  const ps = state.PRONOUNS || [];
  const tenses = [
    { label: "Sedanjik",   forms: v.forms,   abbrev: false },
    { label: "Preteklik",  forms: v.past,    abbrev: true },
    { label: "Prihodnjik", forms: v.future,  abbrev: true },
  ];
  const blocks = tenses.map(({ label, forms, abbrev }) => {
    const rows = ps.map(p => {
      const raw = forms ? (forms[p] || "—") : "—";
      const form = abbrev ? abbreviateForms(raw) : raw;
      return `<div style="display:flex;gap:8px;padding:2px 0">
        <span style="color:#777;font-size:11px;min-width:84px;flex-shrink:0">${p}</span>
        <span style="color:#e8eaed;font-size:11px;overflow-wrap:anywhere">${form}</span>
      </div>`;
    }).join("");
    return `<div style="margin-bottom:10px">
      <div style="color:#f9a8d4;font-size:11px;font-weight:700;margin-bottom:4px">${label}</div>
      ${rows}
    </div>`;
  }).join("");
  return `<div style="padding:10px 14px 12px;border-top:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.02);box-sizing:border-box;width:100%;overflow:hidden">
    ${blocks}
  </div>`;
}

function safe(s) {
  return s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function wordRowHTML(w, showBadge = true) {
  return `<div style="display:flex;align-items:center;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.05);gap:8px">
    <div style="flex:1;min-width:0">
      <div style="color:#e8eaed;font-size:16px;font-weight:600;display:flex;align-items:center;gap:6px;flex-wrap:wrap">
        ${w.sl}
        <button onclick="speakSlovenian('${safe(w.sl)}')" style="background:none;border:none;cursor:pointer;color:#555;font-size:13px;padding:0;line-height:1;flex-shrink:0" title="Posluši">🔊</button>
      </div>
      <div style="color:#888;font-size:13px;margin-top:2px">${w.ru}</div>
    </div>
    ${showBadge ? `<span style="flex-shrink:0;font-size:11px;font-weight:600;padding:3px 8px;border-radius:6px;background:#E1F5EE;color:#0F6E56">beseda</span>` : ""}
  </div>`;
}

function verbRowHTML(v, i) {
  const open = _openVerb === i;
  const preview = verbPreview(v);
  return `<div style="border-bottom:1px solid rgba(255,255,255,.05)">
    <div onclick="toggleVerbAccordion(${i})" style="display:flex;align-items:center;padding:10px 0;gap:8px;cursor:pointer;user-select:none">
      <div style="flex:1;min-width:0">
        <div style="color:#e8eaed;font-size:16px;font-weight:600;display:flex;align-items:center;gap:6px">
          ${v.inf}
          <button onclick="event.stopPropagation();speakSlovenian('${safe(v.inf)}')" style="background:none;border:none;cursor:pointer;color:#555;font-size:13px;padding:0;line-height:1;flex-shrink:0" title="Posluši">🔊</button>
        </div>
        <div style="color:#888;font-size:13px;margin-top:2px">${v.ru}</div>
        ${preview ? `<div style="color:#555;font-size:11px;margin-top:3px">${preview}</div>` : ""}
      </div>
      <span style="flex-shrink:0;font-size:11px;font-weight:600;padding:3px 8px;border-radius:6px;background:#EEEDFE;color:#3C3489">glagol</span>
      <span style="color:#666;font-size:14px;flex-shrink:0">${open ? "▲" : "▼"}</span>
    </div>
    ${open ? verbTableHTML(v) : ""}
  </div>`;
}

// ---- Topic grouping ----

const CAT_LABELS = {
  greet: "👋 Pozdravi",
  phrase: "💬 Fraze",
  people: "👥 Ljudje",
  family: "👨‍👩‍👧 Družina",
  job: "💼 Poklici",
  profession: "👔 Poklici",
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
  adjective: "✨ Pridevniki",
  adverb: "📍 Prislovi",
  noun: "📚 Samostalniki",
  thing: "🧩 Stvari",
  adj: "🔤 Razno",
};

function groupSection(id, label, count, rowsHTML) {
  const open = _openGroups.has(id);
  return `<div style="margin-bottom:2px">
    <div onclick="toggleSlovarGroup('${id}')" style="display:flex;justify-content:space-between;align-items:center;padding:10px 2px 6px;font-size:13px;font-weight:700;color:#aaa;border-top:1px solid rgba(255,255,255,.08);margin-top:4px;cursor:pointer;user-select:none">
      <span>${label} <span style="opacity:.5;font-weight:400">(${count})</span></span>
      <span style="font-size:12px">${open ? "▼" : "▶"}</span>
    </div>
    ${open ? `<div>${rowsHTML}</div>` : ""}
  </div>`;
}

function buildGroupedHTML(words, verbIdxs) {
  let html = "";

  if (words.length > 0) {
    const grouped = {};
    for (const w of words) {
      if (!grouped[w.cat]) grouped[w.cat] = [];
      grouped[w.cat].push(w);
    }
    // Known cats in order
    for (const [cat, label] of Object.entries(CAT_LABELS)) {
      const group = grouped[cat];
      if (!group || group.length === 0) continue;
      const rows = group.map(w => wordRowHTML(w, false)).join("");
      html += groupSection(cat, label, group.length, rows);
    }
    // Unknown cats
    for (const [cat, group] of Object.entries(grouped)) {
      if (CAT_LABELS[cat]) continue;
      const rows = group.map(w => wordRowHTML(w, false)).join("");
      html += groupSection("cat_" + cat, cat, group.length, rows);
    }
  }

  if (verbIdxs.length > 0) {
    const rows = verbIdxs.map(i => verbRowHTML(state.VERBS[i], i)).join("");
    html += groupSection("verbs", "🔤 Glagoli", verbIdxs.length, rows);
  }

  return html || '<div style="text-align:center;color:#777;padding:20px">Ni rezultatov</div>';
}

function buildFlatHTML(words, verbIdxs) {
  let html = "";
  for (const w of words) html += wordRowHTML(w, true);
  for (const i of verbIdxs) html += verbRowHTML(state.VERBS[i], i);
  return html || '<div style="text-align:center;color:#777;padding:20px">Ni rezultatov</div>';
}

const BTN_ACTIVE = "flex:1;padding:8px;border-radius:8px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.12);color:#e8eaed;font-size:13px;font-weight:600;cursor:pointer";
const BTN_INACTIVE = "flex:1;padding:8px;border-radius:8px;border:1px solid rgba(255,255,255,.1);background:#1a1a1a;color:#888;font-size:13px;cursor:pointer";

function buildResults() {
  const q = norm(_query.trim());
  const words = (_filter === "verbs") ? [] : state.LEARN.filter(w =>
    w.cat !== "verb" && (!q || matchWord(w, q))
  );
  const verbIdxs = (_filter === "words") ? [] : state.VERBS.reduce((acc, v, i) => {
    if (!q || matchVerb(v, q)) acc.push(i);
    return acc;
  }, []);

  if (q) {
    const total = words.length + verbIdxs.length;
    return `<div style="font-size:12px;color:#555;margin-bottom:8px">${total} zadetkov</div>` +
      buildFlatHTML(words, verbIdxs);
  }
  return buildGroupedHTML(words, verbIdxs);
}

export function showSlovar() {
  _filter = "all";
  _query = "";
  _openVerb = -1;
  _openGroups = new Set();
  app().innerHTML = `<div class="table-card">
    <button class="back-btn" onclick="goMenu()">← Meni</button>
    <div style="font-size:20px;font-weight:700;margin-bottom:12px">Slovar</div>
    <input id="slovar-search" type="text"
      oninput="filterSlovar(this.value)"
      placeholder="Išči besedo ali glagol…"
      style="width:100%;box-sizing:border-box;padding:10px 14px;font-size:15px;border-radius:10px;border:1px solid rgba(255,255,255,.15);background:#1a1a1a;color:#e8eaed;outline:none;margin-bottom:10px"
      autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
    />
    <div style="display:flex;gap:6px;margin-bottom:12px">
      <button id="sf-all"   onclick="setSlovarFilter('all')"   style="${BTN_ACTIVE}">Vse</button>
      <button id="sf-words" onclick="setSlovarFilter('words')" style="${BTN_INACTIVE}">Besede</button>
      <button id="sf-verbs" onclick="setSlovarFilter('verbs')" style="${BTN_INACTIVE}">Glagoli</button>
    </div>
    <div id="slovar-results">${buildResults()}</div>
  </div>`;
}

export function filterSlovar(query) {
  _query = query;
  _openVerb = -1;
  const el = document.getElementById("slovar-results");
  if (el) el.innerHTML = buildResults();
}

export function setSlovarFilter(filter) {
  _filter = filter;
  _openVerb = -1;
  const btns = { all: document.getElementById("sf-all"), words: document.getElementById("sf-words"), verbs: document.getElementById("sf-verbs") };
  for (const [key, btn] of Object.entries(btns)) {
    if (btn) btn.style.cssText = key === filter ? BTN_ACTIVE : BTN_INACTIVE;
  }
  const el = document.getElementById("slovar-results");
  if (el) el.innerHTML = buildResults();
}

export function toggleVerbAccordion(i) {
  _openVerb = _openVerb === i ? -1 : i;
  const el = document.getElementById("slovar-results");
  if (el) el.innerHTML = buildResults();
}

export function toggleSlovarGroup(id) {
  if (_openGroups.has(id)) _openGroups.delete(id);
  else _openGroups.add(id);
  const el = document.getElementById("slovar-results");
  if (el) el.innerHTML = buildResults();
}

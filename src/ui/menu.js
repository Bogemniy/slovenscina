import { state, shuffle, loadWordQueue, loadVerbQueue, loadWordProgress } from "../state.js";
import { fbState, updateAuthBar } from "./auth-bar.js";
import { app } from "./dom.js";

export function renderMenu() {
  app().innerHTML = `<div class="menu-card">
    <div class="menu-flag">🇸🇮</div>
    <div class="menu-title">Slovenščina</div>
    <div class="menu-sub">${state.WORDS.length} besed · ${state.VERBS.length} glagolov · ${state.SENTENCES.length} stavkov</div>

    <button class="menu-btn table-btn" style="font-size:17px;padding:16px" onclick="startGrammar()">📐 Slovnica</button>
    <div style="display:flex;gap:6px;margin-top:6px">
      <button class="menu-btn table-btn" style="flex:1;font-size:17px;padding:16px;margin:0" onclick="showBesednjak()">📖 Besednjak</button>
      <button class="menu-btn table-btn" style="flex:1;font-size:17px;padding:16px;margin:0" onclick="showVerbList('present',true)">🔤 Glagoli</button>
    </div>

    <div class="divider"></div>

    <button class="menu-btn" style="background:linear-gradient(135deg,rgba(52,211,153,.18),rgba(16,185,129,.1));border:1px solid rgba(52,211,153,.25);color:#6ee7b7" onclick="startLearn()">🧠 Hočem vedeti</button>
    <button class="menu-btn" style="background:linear-gradient(135deg,rgba(249,168,212,.18),rgba(236,72,153,.1));border:1px solid rgba(249,168,212,.25);color:#f9a8d4" onclick="startVerbs()">🔤 Spregatve glagolov</button>
    <button class="menu-btn" style="background:linear-gradient(135deg,rgba(99,102,241,.18),rgba(79,70,229,.1));border:1px solid rgba(99,102,241,.25);color:#a5b4fc" onclick="startLesson()">📚 Lekcija</button>
    <button class="menu-btn" style="background:linear-gradient(135deg,rgba(252,211,77,.18),rgba(245,158,11,.1));border:1px solid rgba(252,211,77,.25);color:#fcd34d" onclick="startReading()">📖 Branje in razumevanje</button>

    <div class="divider"></div>
    <div id="auth-status" style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:#1a1a1a;border-radius:14px;border:1px solid rgba(255,255,255,.07);min-height:46px"></div>
  </div>`;
  updateAuthBar();
}

export function goMenu() {
  state.ui = { mode: "menu" };
  renderMenu();
  updateAuthBar();
}

export function resetProgress() {
  if (!confirm("Ponastaviti ves napredek? To bo izbrisalo ravni znanja vseh besed in zgodovino vrst.")) return;
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
        () => alert("✓ Napredek shranjen v datoteko in kopiran v odložišče."),
        () => alert("✓ Napredek shranjen v datoteko.")
      );
    } else {
      alert("✓ Napredek shranjen v datoteko.");
    }
  } catch (e) {
    alert("Napaka pri izvozu: " + e.message);
  }
}

export function importProgress() {
  const txt = prompt("Vstavi izvoženi napredek (JSON):");
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
      "✓ Napredek obnovljen!\nBesede: " +
        state.wordsSeen +
        "/" +
        state.WORDS.length +
        "\nGlagoli: " +
        state.verbsSeen +
        "/" +
        state.VERBS.length * 9 +
        "\nV delu: " +
        learned
    );
  } catch (e) {
    alert("Napaka pri uvozu: " + e.message + "\n\nPreveri, da si vstavil pravilen JSON.");
  }
}

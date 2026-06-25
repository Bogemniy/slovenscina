import { state } from "../state.js";
import { app } from "./dom.js";

function renderBlock(b) {
  if (b.type === "text") {
    return `<div style="margin:0 0 16px;line-height:1.6;white-space:pre-wrap;color:#e8eaed">${b.content}</div>`;
  }
  if (b.type === "note") {
    return `<div style="margin:0 0 16px;padding:12px 14px;background:rgba(250,204,21,.08);border:1px solid rgba(250,204,21,.25);border-radius:10px;line-height:1.6;white-space:pre-wrap;color:#e8eaed">💡 ${b.content}</div>`;
  }
  if (b.type === "examples") {
    return `<div style="margin:0 0 16px;padding:12px 14px;background:rgba(249,168,212,.06);border-left:3px solid rgba(249,168,212,.4);border-radius:6px">${b.content.map(e => `<div style="font-style:italic;margin:4px 0;color:#e8eaed">${e}</div>`).join("")}</div>`;
  }
  if (b.type === "table") {
    const cap = b.caption ? `<div style="font-size:13px;font-weight:600;color:#f9a8d4;margin-bottom:8px">${b.caption}</div>` : "";
    const head = `<tr>${b.headers.map(h => `<th style="text-align:left;padding:8px 12px;border-bottom:2px solid rgba(249,168,212,.3);color:#f9a8d4;font-size:13px;white-space:nowrap">${h}</th>`).join("")}</tr>`;
    const body = b.rows.map(r => `<tr>${r.map((c, i) => `<td style="padding:8px 12px;border-bottom:1px solid rgba(255,255,255,.06);white-space:nowrap;${i === 0 ? "color:#888;font-size:13px" : "color:#e8eaed"}">${c}</td>`).join("")}</tr>`).join("");
    return `<div style="margin:0 0 18px">${cap}<div style="overflow-x:auto;-webkit-overflow-scrolling:touch;border:1px solid rgba(255,255,255,.08);border-radius:10px"><table style="border-collapse:collapse;width:100%;min-width:max-content">${head}${body}</table></div></div>`;
  }
  return "";
}

export function startGrammar() {
  const groups = {};
  for (const t of state.GRAMMAR) {
    (groups[t.group] = groups[t.group] || []).push(t);
  }
  const sections = Object.entries(groups).map(([group, topics], gi) => {
    const id = "gg" + gi;
    const items = topics.map(t => `<button class="verb-chip" style="display:block;width:100%;text-align:left;margin:4px 0" onclick="showGrammarTopic('${t.id}')">${t.title}</button>`).join("");
    return `<div style="margin-bottom:8px;border:1px solid rgba(255,255,255,.08);border-radius:10px;overflow:hidden">
      <div onclick="(function(el){var c=document.getElementById('${id}');c.style.display=c.style.display==='none'?'block':'none';el.querySelector('.acc-arrow').textContent=c.style.display==='none'?'▶':'▼'})(this)" style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;cursor:pointer;background:#1a1a1a;font-weight:600;font-size:14px">
        <span>${group} <span style="font-size:12px;opacity:.6">(${topics.length})</span></span>
        <span class="acc-arrow">▼</span>
      </div>
      <div id="${id}" style="display:block;padding:10px">${items}</div>
    </div>`;
  }).join("");

  app().innerHTML = `<div class="table-card">
    <button class="back-btn" onclick="goMenu()">← Meni</button>
    <div style="font-size:20px;font-weight:700;margin-bottom:14px">📐 Slovnica</div>
    ${sections}
  </div>`;
}

export function showGrammarTopic(id) {
  const t = state.GRAMMAR.find(x => x.id === id);
  if (!t) return;
  const body = t.blocks.map(renderBlock).join("");
  app().innerHTML = `<div class="table-card">
    <button class="back-btn" onclick="startGrammar()">← Nazaj</button>
    <div style="font-size:20px;font-weight:700;margin:6px 0 18px">${t.title}</div>
    ${body}
  </div>`;
}

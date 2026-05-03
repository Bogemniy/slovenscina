export const fbState = { user: null, syncing: false, dirty: false, saveTimer: null, preLoginSnapshot: null };

export function updateAuthBar() {
  let bar = document.getElementById("auth-bar");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "auth-bar";
    bar.style.cssText =
      "position:fixed;top:8px;right:8px;z-index:100;background:rgba(255,255,255,0.95);border:1px solid #e0e6ec;border-radius:20px;padding:6px 12px;font-size:12px;display:flex;align-items:center;gap:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08)";
    document.body.appendChild(bar);
  }
  const u = fbState.user;
  if (u) {
    const name = (u.displayName || u.email || "").split(" ")[0] || "Вы";
    const sync = fbState.syncing ? "⟳" : fbState.dirty ? "•" : "✓";
    bar.innerHTML = `<span style="color:#3a5a78">☁ ${sync} ${name}</span><button onclick="fbSignOut()" style="border:none;background:none;color:#888;cursor:pointer;font-size:11px;padding:0">выйти</button>`;
  } else {
    bar.innerHTML = `<button onclick="fbSignIn()" style="border:none;background:none;color:#3a5a78;cursor:pointer;font-size:12px;padding:0;font-weight:500">☁ Войти через Google</button>`;
  }
}

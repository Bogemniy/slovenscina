export const fbState = { user: null, syncing: false, dirty: false, saveTimer: null, preLoginSnapshot: null };

export function updateAuthBar() {
  const el = document.getElementById("auth-status");
  if (!el) return;
  const u = fbState.user;
  if (u) {
    const name = (u.displayName || u.email || "").split(" ")[0] || "Ti";
    const sync = fbState.syncing ? "⟳" : fbState.dirty ? "•" : "✓";
    el.innerHTML = `
      <span style="font-size:13px;color:#93c5fd;font-weight:500">☁ ${sync} ${name}</span>
      <button onclick="fbSignOut()" style="border:none;background:none;color:#555;cursor:pointer;font-size:12px;padding:0;font-family:inherit">Odjava</button>`;
  } else {
    el.innerHTML = `
      <button onclick="fbSignIn()" style="width:100%;border:none;background:#fff;color:#111;cursor:pointer;font-size:15px;font-weight:600;font-family:inherit;padding:12px;border-radius:10px;text-align:center">☁ Prijava z Google</button>`;
  }
}

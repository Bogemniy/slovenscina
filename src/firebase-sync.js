import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

import { firebaseConfig } from "./config.js";
import { fbState, updateAuthBar } from "./ui/auth-bar.js";
import { loadWordProgress, loadWordQueue, loadVerbQueue } from "./state.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

function snapshotLocal() {
  return {
    wp: localStorage.getItem("wp") || "",
    wq: localStorage.getItem("wq") || "",
    vq: localStorage.getItem("vq") || "",
    updatedAt: Date.now(),
  };
}

function applySnapshot(snap) {
  if (snap.wp) localStorage.setItem("wp", snap.wp);
  else localStorage.removeItem("wp");
  if (snap.wq) localStorage.setItem("wq", snap.wq);
  else localStorage.removeItem("wq");
  if (snap.vq) localStorage.setItem("vq", snap.vq);
  else localStorage.removeItem("vq");
  loadWordProgress();
  loadWordQueue();
  loadVerbQueue();
}

function mergeSnapshots(local, cloud) {
  let wpL = {}, wpC = {};
  try { wpL = JSON.parse(local.wp || "{}"); } catch {}
  try { wpC = JSON.parse(cloud.wp || "{}"); } catch {}
  const merged = {};
  const keys = new Set([...Object.keys(wpL), ...Object.keys(wpC)]);
  keys.forEach((k) => {
    const a = wpL[k], b = wpC[k];
    if (!a) { merged[k] = b; return; }
    if (!b) { merged[k] = a; return; }
    if (a.level !== b.level) merged[k] = a.level > b.level ? a : b;
    else merged[k] = (a.lastSeen || 0) >= (b.lastSeen || 0) ? a : b;
  });
  const newer = (local.updatedAt || 0) >= (cloud.updatedAt || 0) ? local : cloud;
  return { wp: JSON.stringify(merged), wq: newer.wq || "", vq: newer.vq || "", updatedAt: Date.now() };
}

async function loadFromCloud(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

async function saveToCloud(uid) {
  if (!uid) return;
  const ref = doc(db, "users", uid);
  await setDoc(ref, { ...snapshotLocal(), serverTime: serverTimestamp() }, { merge: true });
}

function scheduleCloudSave() {
  if (!fbState.user) return;
  fbState.dirty = true;
  if (fbState.saveTimer) clearTimeout(fbState.saveTimer);
  fbState.saveTimer = setTimeout(async () => {
    try {
      fbState.syncing = true;
      updateAuthBar();
      await saveToCloud(fbState.user.uid);
      fbState.dirty = false;
    } catch (e) {
      console.warn("Cloud save failed:", e);
    } finally {
      fbState.syncing = false;
      updateAuthBar();
    }
  }, 1500);
}

// Patch localStorage so any write to progress keys triggers a cloud save.
const _setItem = localStorage.setItem.bind(localStorage);
localStorage.setItem = function (k, v) {
  _setItem(k, v);
  if (k === "wp" || k === "wq" || k === "vq") scheduleCloudSave();
};

export async function fbSignIn() {
  // Capture local state before popup — in-memory survives the popup since we don't navigate away.
  if (!fbState.preLoginSnapshot) {
    fbState.preLoginSnapshot = {
      wp: localStorage.getItem("wp") || "",
      wq: localStorage.getItem("wq") || "",
      vq: localStorage.getItem("vq") || "",
      updatedAt: Date.now(),
    };
  }
  try {
    await signInWithPopup(auth, provider);
    // onAuthStateChanged fires after popup closes successfully.
  } catch (e) {
    fbState.preLoginSnapshot = null;
    if (e.code === "auth/popup-closed-by-user" || e.code === "auth/cancelled-popup-request") return;
    alert("Napaka pri prijavi: " + (e.message || e.code));
  }
}

export async function fbSignOut() {
  if (fbState.user && fbState.dirty) {
    try { await saveToCloud(fbState.user.uid); } catch {}
  }
  await signOut(auth);
  if (fbState.preLoginSnapshot) {
    applySnapshot(fbState.preLoginSnapshot);
    fbState.preLoginSnapshot = null;
  }
  if (typeof window.renderMenu === "function") window.renderMenu();
}

function askMergeChoice() {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.style.cssText =
      "position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px";
    overlay.innerHTML = `<div style="background:#fff;border-radius:14px;padding:22px;max-width:400px;text-align:center;box-shadow:0 10px 40px rgba(0,0,0,0.3)">
      <div style="font-size:42px;margin-bottom:10px">🔄</div>
      <div style="font-size:18px;font-weight:600;margin-bottom:8px;color:#1a3a5e">Najdena dva napredka</div>
      <div style="font-size:14px;color:#5a7a94;margin-bottom:18px;line-height:1.5">Lokalni in oblačni napredek. Kaj narediti?</div>
      <button id="merge-btn" style="display:block;width:100%;padding:12px;margin-bottom:8px;border:none;border-radius:10px;background:#3b82f6;color:#fff;font-weight:600;cursor:pointer;font-size:14px">Združi (vzemi najboljše iz obeh)</button>
      <button id="cloud-btn" style="display:block;width:100%;padding:12px;margin-bottom:8px;border:1px solid #c8d2dd;background:#fff;border-radius:10px;cursor:pointer;font-size:14px">Obdrži oblačni (zamenja lokalni)</button>
      <button id="local-btn" style="display:block;width:100%;padding:12px;border:1px solid #c8d2dd;background:#fff;border-radius:10px;cursor:pointer;font-size:14px">Obdrži lokalni (prepiše oblak)</button>
    </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector("#merge-btn").onclick = () => { document.body.removeChild(overlay); resolve("merge"); };
    overlay.querySelector("#cloud-btn").onclick = () => { document.body.removeChild(overlay); resolve("cloud"); };
    overlay.querySelector("#local-btn").onclick = () => { document.body.removeChild(overlay); resolve("local"); };
  });
}

export function initFirebase() {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      if (!fbState.preLoginSnapshot) fbState.preLoginSnapshot = snapshotLocal();
      fbState.user = user;
      try {
        fbState.syncing = true;
        updateAuthBar();
        const cloud = await loadFromCloud(user.uid);
        const localHasData = !!localStorage.getItem("wp") || !!localStorage.getItem("wq") || !!localStorage.getItem("vq");
        const cloudHasData = cloud && (cloud.wp || cloud.wq || cloud.vq);
        if (cloudHasData && localHasData) {
          const choice = await askMergeChoice();
          if (choice === "merge") {
            const merged = mergeSnapshots(snapshotLocal(), cloud);
            applySnapshot(merged);
            await setDoc(doc(db, "users", user.uid), { ...merged, serverTime: serverTimestamp() }, { merge: true });
          } else if (choice === "cloud") {
            applySnapshot(cloud);
          } else if (choice === "local") {
            await saveToCloud(user.uid);
          }
        } else if (cloudHasData) {
          applySnapshot(cloud);
        } else if (localHasData) {
          await saveToCloud(user.uid);
        }
      } catch (e) {
        console.warn("Sync on login failed:", e);
        alert("Sinhronizacija z oblakom ni uspela: " + (e.message || e.code) + "\nNapredek ostaja lokalen.");
      } finally {
        fbState.syncing = false;
      }
      if (typeof window.renderMenu === "function") window.renderMenu();
    } else {
      fbState.user = null;
    }
    updateAuthBar();
  });
  updateAuthBar();
}

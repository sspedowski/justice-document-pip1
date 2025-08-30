import "./main.css";
import { authFetch } from "./lib/auth-fetch.js";

async function loadMe() {
  const r = await authFetch("/api/me");
  const { user } = await r.json();
  document.getElementById("user").textContent = user?.name ?? "Guest";
}

document.addEventListener("DOMContentLoaded", () => {
  loadMe();
  const f = document.getElementById("guest-form");
  f.addEventListener("submit", async (e) => {
    e.preventDefault();
    const message = new FormData(f).get("message");
    const r = await authFetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    document.getElementById("result").textContent = JSON.stringify(
      await r.json(),
      null,
      2
    );
    f.reset();
  });

  // Dev-only ping button (unobtrusive). Will work when Vite proxies /api to backend.
  const pingBtn = document.getElementById('pingBtn');
  if (pingBtn) {
    pingBtn.addEventListener('click', async () => {
      try {
        const res = await fetch('/api/_ping', { credentials: 'include' });
        const json = await res.json();
        document.getElementById('pingOut').textContent = JSON.stringify(json, null, 2);
      } catch (err) {
        document.getElementById('pingOut').textContent = String(err);
      }
    });
  }
});

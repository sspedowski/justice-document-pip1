import "./main.css";
import { login } from "./login.js";
import { authFetch } from "./lib/auth-fetch.js";

const sel = (id) => document.getElementById(id);
const form = sel("login-form");
const email = sel("email");
const password = sel("password");
const msg = sel("msg");
const panel = sel("user-panel");
const meBox = sel("me");
const logoutBtn = sel("logout");

function ui(state, data) {
  if (state === "anon") { form.classList.remove("hidden"); panel.classList.add("hidden"); msg.textContent=""; }
  if (state === "auth") { form.classList.add("hidden"); panel.classList.remove("hidden"); meBox.textContent = JSON.stringify(data, null, 2); msg.textContent=""; }
  if (state === "error") { msg.textContent = data; msg.className = "mt-3 text-sm text-red-600"; }
}

async function loadMe() {
  const r = await authFetch("/api/me");
  if (r.ok) { const d = await r.json(); ui("auth", d); }
  else { ui("anon"); }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  try { await login(email.value, password.value); await loadMe(); }
  catch (err) { ui("error", err.message || "Login failed"); }
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token"); ui("anon");
});

loadMe();

import './main.css';
import { authFetch } from './lib/auth-fetch';

const out = (msg) => { const el = document.getElementById('result'); if (el) el.textContent = msg; };

async function boot() {
  try {
    const me = await (await authFetch('/api/me')).json();
    const who = document.getElementById('who') || document.getElementById('user');
    if (who) who.textContent = me?.user?.name || 'Guest';
  } catch { /* ignore */ }

  const form = document.getElementById('msg-form') || document.getElementById('guest-form');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = new FormData(form).get('message') || '';
    const res = await (await authFetch('/api/submit', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message })
    })).json();
    out(JSON.stringify(res, null, 2));
  });
}
boot();

import './main.css';
import { authFetch, startRefreshLoop } from './lib/auth-fetch.js';

(async () => {
  const res = await authFetch('/api/me');
  const me = await res.json();
  document.body.innerHTML = `<main class="p-6"><h1>Justice Dashboard</h1><p>User: ${me.name || 'Guest'}</p></main>`;
  if (me.role !== 'guest') startRefreshLoop();
})();

import { authFetch } from './lib/auth-fetch';

export async function login(email, password) {
  const r = await authFetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || 'Login failed');
  return d; // cookie set by server
}

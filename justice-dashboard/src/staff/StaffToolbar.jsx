/* eslint-env browser */
import { useEffect } from 'react';

import { authFetch } from '../lib/auth-fetch.js';
import { staffToolbarEnabled, getToolbarDomainPattern } from '../utils/featureFlags.js';

// Lightweight staff toolbar loader for the Vite app.
// Loads Vercel Toolbar script only when enabled and the user is staff.
export default function StaffToolbar() {
  useEffect(() => {
    try {
      // Skip in test runs
      if (import.meta && import.meta.env && import.meta.env.MODE === 'test') return;

      // Feature flag check with localStorage override and env parity
      const enabled = staffToolbarEnabled({ env: import.meta?.env, win: typeof window !== 'undefined' ? window : undefined });
      if (!enabled) return;

      const domainPattern = getToolbarDomainPattern({ env: import.meta?.env, win: typeof window !== 'undefined' ? window : undefined });
      if (domainPattern) {
        try {
          const re = new RegExp(domainPattern);
          if (!re.test(window.location.hostname)) return;
        } catch {
          // ignore invalid regex
        }
      }

      let cancelled = false;
      (async () => {
        let staff = false;
        try {
          const r = await authFetch('/api/me', { credentials: 'include' });
          if (r.ok) {
            const data = await r.json().catch(() => ({}));
            staff = !!data?.staff;
          }
        } catch {
          // Network errors are non-fatal; just skip toolbar
          return;
        }
        if (cancelled || !staff) return;
        if (document.querySelector('script[data-vercel-toolbar]')) return;
        const s = document.createElement('script');
        s.src = 'https://vercel.com/toolbar/script.js';
        s.defer = true;
        s.setAttribute('data-vercel-toolbar', 'true');
        document.head.appendChild(s);
      })();

      return () => {
        cancelled = true;
      };
    } catch {
      // never block the app
    }
  }, []);
  return null;
}

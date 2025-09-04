/* eslint-env browser */
import { useEffect } from 'react';

// Lightweight staff toolbar loader for the Vite app.
// Loads Vercel Toolbar script only when enabled and the user is staff.
// Env detection:
//  - Vite: import.meta.env.VITE_VERCEL_TOOLBAR_ENABLED === 'true'
//  - Optional domain guard: VITE_VERCEL_TOOLBAR_DOMAIN_REGEX (regex string)
//  - Also respects NEXT_PUBLIC_* if present on window for consistency with Next apps
export default function StaffToolbar() {
  useEffect(() => {
    try {
      // Skip in Jest/node test runs
      if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test') return;

      const viteEnabled = typeof import !== 'undefined' && typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_VERCEL_TOOLBAR_ENABLED === 'true';
      const nextEnabled = typeof window !== 'undefined' && window.NEXT_PUBLIC_VERCEL_TOOLBAR_ENABLED === 'true';
      if (!(viteEnabled || nextEnabled)) return;

      const domainPattern = (import.meta?.env?.VITE_VERCEL_TOOLBAR_DOMAIN_REGEX) || (typeof window !== 'undefined' ? window.NEXT_PUBLIC_VERCEL_TOOLBAR_DOMAIN_REGEX : undefined);
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
          const r = await fetch('/api/me', { credentials: 'include' });
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

      return () => { cancelled = true; };
    } catch {
      // never block the app
    }
  }, []);
  return null;
}


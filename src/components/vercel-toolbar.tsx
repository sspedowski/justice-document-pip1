"use client";
import { useEffect } from "react";

/**
 * Hybrid Vercel Toolbar loader:
 *  - Client-side: calls /api/me (from legacy server or Next proxy) to determine staff
 *  - Loads the toolbar script only when enabled + staff
 *
 * Env vars:
 *  NEXT_PUBLIC_VERCEL_TOOLBAR_ENABLED ("true" to enable on client)
 *  Optional domain guard: set NEXT_PUBLIC_VERCEL_TOOLBAR_DOMAIN_REGEX (e.g. ".*yourprod\.com$")
 */
export function VercelToolbar() {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_VERCEL_TOOLBAR_ENABLED !== "true") return;
    const domainPattern = process.env.NEXT_PUBLIC_VERCEL_TOOLBAR_DOMAIN_REGEX;
    if (domainPattern) {
      try {
        const re = new RegExp(domainPattern);
        if (!re.test(window.location.hostname)) return;
      } catch {
        // invalid regex; ignore
      }
    }
    let cancelled = false;
    (async () => {
      let staff = false;
      try {
        const r = await fetch('/api/me', { credentials: 'include' });
        if (r.ok) {
          const data = await r.json();
            staff = !!data?.staff;
        }
      } catch {
        return;
      }
      if (!staff || cancelled) return;
      if (document.querySelector('script[data-vercel-toolbar]')) return;
      const s = document.createElement('script');
      s.src = 'https://vercel.com/toolbar/script.js';
      s.defer = true;
      s.setAttribute('data-vercel-toolbar', 'true');
      document.head.appendChild(s);
    })();
    return () => { cancelled = true; };
  }, []);
  return null;
}

export default VercelToolbar;

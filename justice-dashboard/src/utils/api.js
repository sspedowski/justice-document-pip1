const API_BASE = (import.meta?.env?.VITE_API_BASE || '/api');
export const api = (p = '') => `${API_BASE}${p ? (p.startsWith('/') ? p : `/${p}`) : ''}`;

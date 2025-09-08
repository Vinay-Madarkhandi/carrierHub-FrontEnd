// lib/auth-utils.ts
'use client';

export const TOKEN_KEY = 'token'; // Use same key as existing auth system

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export function getSafeRedirect(next: string | null, defaultPath = '/dashboard'): string {
  if (!next || typeof next !== 'string') return defaultPath;
  // Must be internal path
  if (!next.startsWith('/')) return defaultPath;
  // Disallow protocol-relative external
  if (next.startsWith('//')) return defaultPath;
  // Optional: block api routes from being navigated to
  if (next.startsWith('/api')) return defaultPath;
  return next;
}

export function logout(router?: ReturnType<typeof import('next/navigation').useRouter>) {
  try { 
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('user'); // Also clear our existing user
  } catch {}
  router?.replace('/login');
}

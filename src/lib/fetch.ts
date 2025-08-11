export async function apiFetch(path: string, init: RequestInit = {}) {
  const base = typeof window === 'undefined' ? process.env.NEXT_PUBLIC_BASE_URL ?? '' : '';
  const orgId = typeof window !== 'undefined' ? localStorage.getItem('orgId') ?? '' : '';

  const headers = new Headers(init.headers || {});
  if (orgId) headers.set('x-org-id', orgId);

  return fetch(base + path, { ...init, headers, cache: 'no-store' });
}

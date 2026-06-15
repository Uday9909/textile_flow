// ============================================================
// TextileFlow MES — Authenticated Fetch Wrapper
// ============================================================
// Access token stored in module-level variable (NOT localStorage)
// per PITFALLS.md rule #1: localStorage JWT is XSS-exposed.
// ============================================================

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

let accessToken = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function clearAccessToken() {
  accessToken = null;
}

export async function refreshAccessToken() {
  const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!res.ok) {
    clearAccessToken();
    return null;
  }

  const data = await res.json();
  if (data.accessToken) {
    setAccessToken(data.accessToken);
    return data.accessToken;
  }

  return null;
}

export async function api(url, options = {}) {
  const { headers: customHeaders, ...rest } = options;

  const headers = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  let res = await fetch(`${BASE_URL}${url}`, {
    ...rest,
    headers,
    credentials: 'include',
  });

  // On 401, attempt silent refresh then retry once
  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(`${BASE_URL}${url}`, {
        ...rest,
        headers,
        credentials: 'include',
      });
    }
  }

  return res;
}

// Convenience wrappers

export async function login(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Login failed' }));
    throw new Error(err.error || 'Login failed');
  }

  const data = await res.json();
  if (data.accessToken) {
    setAccessToken(data.accessToken);
  }
  return data;
}

export async function logout() {
  const res = await fetch(`${BASE_URL}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
  clearAccessToken();
  return res.json().catch(() => ({}));
}

export async function me() {
  const res = await api('/api/auth/me');
  if (!res.ok) {
    throw new Error('Not authenticated');
  }
  return res.json();
}

export async function refresh() {
  const data = await refreshAccessToken();
  if (!data) {
    throw new Error('Refresh failed');
  }
  return data;
}

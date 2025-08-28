// src/lib/auth.js
export function getToken() {
  if (typeof window === 'undefined') return null;

  // Prefer admin token, then user token, then legacy accessToken
  return (
    localStorage.getItem('adminToken') ||
    localStorage.getItem('gambino_token') ||
    localStorage.getItem('accessToken') ||
    sessionStorage.getItem('adminToken') ||
    sessionStorage.getItem('gambino_token') ||
    sessionStorage.getItem('accessToken') ||
    null
  );
}

export function setToken(token, { remember = true, isAdmin = false } = {}) {
  if (typeof window === 'undefined') return;

  const storage = remember ? localStorage : sessionStorage;

  // Write a single canonical key for the interceptor:
  storage.setItem('accessToken', token);

  // Back-compat for existing code paths you already wrote:
  if (isAdmin) storage.setItem('adminToken', token);
  else storage.setItem('gambino_token', token);

  // Clean up the other store (optional but tidy)
  const other = remember ? sessionStorage : localStorage;
  ['accessToken', 'adminToken', 'gambino_token'].forEach(k => other.removeItem(k));
}

export function clearToken() {
  if (typeof window === 'undefined') return;
  ['accessToken','adminToken','gambino_token'].forEach(k => {
    localStorage.removeItem(k);
    sessionStorage.removeItem(k);
  });
  document.cookie = 'token=; Max-Age=0; path=/';
}

export default { getToken, setToken, clearToken };

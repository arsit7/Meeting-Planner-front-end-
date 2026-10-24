const TOKEN_KEY = 'meetingPlanner.token';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Storage unavailable (private mode etc.): the session lasts until reload.
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

/**
 * Reads the `exp` claim (in ms) without verifying the signature, or null if unreadable. This is
 * only a UX shortcut to log out early; the backend always verifies the token on every request.
 */
export function getTokenExpiryMs(token) {
  try {
    const payload = token.split('.')[1];
    const { exp } = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isTokenExpired(token, nowMs = Date.now()) {
  const expiry = token ? getTokenExpiryMs(token) : null;
  return expiry === null || expiry <= nowMs;
}

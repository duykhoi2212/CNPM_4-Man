export function getStoredUser() {
  try {
    const raw = localStorage.getItem('user_info');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getUserInfo() {
  return getStoredUser();
}

export function setAuthSession({ token, user }) {
  localStorage.setItem('access_token', token);
  localStorage.setItem('user_info', JSON.stringify(user));
}

export function updateStoredUser(user) {
  localStorage.setItem('user_info', JSON.stringify(user));
}

export function clearAuthSession() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user_info');
}

export function clearAuth() {
  clearAuthSession();
}

export function isAuthenticated() {
  return Boolean(localStorage.getItem('access_token'));
}

import axios from 'axios';

// Fetch the baked-in URL once at module load; await it in the request interceptor.
// This avoids all Turbopack NEXT_PUBLIC_* inlining issues and React hydration races.
const _basePromise: Promise<string> =
  typeof window !== 'undefined'
    ? fetch('/api-url.txt')
        .then((r) => r.text())
        .then((t) => t.trim() || 'http://localhost:4000/api')
        .catch(() => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api')
    : Promise.resolve(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api');

export const api = axios.create();

function readState() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem('auth-store-v3');
    return raw ? (JSON.parse(raw)?.state ?? {}) : {};
  } catch { return {}; }
}

api.interceptors.request.use(async (config) => {
  config.baseURL ??= await _basePromise;
  const state = readState();
  if (state.accessToken) config.headers.Authorization = `Bearer ${state.accessToken}`;
  if (state.storeId) config.headers['x-store-id'] = state.storeId;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    // Skip refresh only for unauthenticated auth endpoints (login/register/refresh/social login).
    // Authenticated /auth/* paths (e.g. change-password) must still go through the refresh flow.
    const unauthPaths = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout', '/auth/google', '/auth/facebook'];
    if (unauthPaths.some((p) => original?.url?.includes(p))) throw error;
    // Only refresh for gateway auth failures (no response body).
    // Domain 401s (e.g. wrong current password) carry a message body — don't refresh those.
    const isDomainError = error.response?.data && typeof error.response.data === 'object' && (error.response.data as Record<string, unknown>).message;
    if (error.response?.status === 401 && !original._retry && !isDomainError) {
      original._retry = true;
      try {
        const { refreshToken } = readState();
        if (!refreshToken) throw new Error('no refresh token');
        const { data } = await axios.post(`${await _basePromise}/auth/refresh`, { refreshToken });
        // Update persisted state
        try {
          const raw = localStorage.getItem('auth-store-v3');
          if (raw) {
            const parsed = JSON.parse(raw);
            parsed.state.accessToken = data.accessToken;
            parsed.state.refreshToken = data.refreshToken;
            localStorage.setItem('auth-store-v3', JSON.stringify(parsed));
          }
        } catch { /* ignore */ }
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem('auth-store-v3');
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) window.location.href = '/login';
      }
    }
    throw error;
  }
);

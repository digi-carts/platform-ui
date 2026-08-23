import axios from 'axios';

const getBase = () =>
  (typeof window !== 'undefined' ? (window as any).__API_URL__ : null) ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:4000/api';

export const api = axios.create();

function readState() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem('auth-store-v3');
    return raw ? (JSON.parse(raw)?.state ?? {}) : {};
  } catch { return {}; }
}

api.interceptors.request.use((config) => {
  config.baseURL ??= getBase();
  const state = readState();
  if (state.accessToken) config.headers.Authorization = `Bearer ${state.accessToken}`;
  if (state.storeId) config.headers['x-store-id'] = state.storeId;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    // Never intercept auth endpoints — let the login/register handlers show their own errors
    if (original?.url?.includes('/auth/')) throw error;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { refreshToken } = readState();
        if (!refreshToken) throw new Error('no refresh token');
        const { data } = await axios.post(`${getBase()}/auth/refresh`, { refreshToken });
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

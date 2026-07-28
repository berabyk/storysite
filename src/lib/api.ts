/**
 * API client for the StorySite backend (.NET / Cloud Run).
 *
 * Handles the base URL, JWT access token, and transparent refresh-token
 * rotation on 401. Override the base URL with VITE_API_BASE at build time.
 */

const API_BASE =
  import.meta.env.VITE_API_BASE ??
  "https://storysite-api-ywokeenwmq-ey.a.run.app";

export interface AuthUser {
  id: string;
  userName: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  roles: string[];
}

export interface AuthResponse {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  user: AuthUser;
}

const ACCESS_KEY = "ss_access";
const REFRESH_KEY = "ss_refresh";

export const tokenStore = {
  get access() {
    return localStorage.getItem(ACCESS_KEY);
  },
  get refresh() {
    return localStorage.getItem(REFRESH_KEY);
  },
  set(access: string, refresh: string) {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function tryRefresh(): Promise<boolean> {
  const refresh = tokenStore.refresh;
  if (!refresh) return false;
  try {
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
    });
    if (!res.ok) {
      tokenStore.clear();
      return false;
    }
    const data = (await res.json()) as AuthResponse;
    tokenStore.set(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

async function request(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<Response> {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");
  const access = tokenStore.access;
  if (access) headers.set("Authorization", `Bearer ${access}`);

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401 && retry && tokenStore.refresh) {
    if (await tryRefresh()) return request(path, options, false);
  }
  return res;
}

/** Request helper that parses JSON and throws ApiError on non-2xx. */
export async function apiJson<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await request(path, options);
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message =
      data?.error ??
      (Array.isArray(data?.errors) ? data.errors.join(" ") : null) ??
      `İstek başarısız (${res.status})`;
    throw new ApiError(res.status, message);
  }
  return data as T;
}

export const api = {
  base: API_BASE,
  request,

  register(body: {
    email: string;
    userName: string;
    password: string;
    displayName?: string;
  }) {
    return apiJson<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  login(body: { emailOrUserName: string; password: string }) {
    return apiJson<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  me() {
    return apiJson<AuthUser>("/api/auth/me");
  },

  async logout() {
    const refresh = tokenStore.refresh;
    if (refresh) {
      try {
        await request("/api/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refreshToken: refresh }),
        });
      } catch {
        /* ignore */
      }
    }
    tokenStore.clear();
  },
};

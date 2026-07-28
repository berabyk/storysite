import * as React from "react";

import { api, tokenStore, type AuthResponse, type AuthUser } from "./api";

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  login: (emailOrUserName: string, password: string) => Promise<void>;
  register: (body: {
    email: string;
    userName: string;
    password: string;
    displayName?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Hydrate the session from a stored token on first load.
  React.useEffect(() => {
    let active = true;
    if (!tokenStore.access) {
      setLoading(false);
      return;
    }
    api
      .me()
      .then((u) => active && setUser(u))
      .catch(() => {
        tokenStore.clear();
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const apply = (res: AuthResponse) => {
    tokenStore.set(res.accessToken, res.refreshToken);
    setUser(res.user);
  };

  const value = React.useMemo<AuthState>(
    () => ({
      user,
      loading,
      async login(emailOrUserName, password) {
        apply(await api.login({ emailOrUserName, password }));
      },
      async register(body) {
        apply(await api.register(body));
      },
      async logout() {
        await api.logout();
        setUser(null);
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

import * as React from "react";

export interface UniverseTheme {
  background?: string | null;
  textColor?: string | null;
  accent?: string | null;
  font?: string | null;
}

/** The universe the visitor is currently "inside" — scopes content + theme. */
export interface ActiveUniverse {
  id: string;
  slug: string;
  name: string;
  theme: UniverseTheme;
}

interface Ctx {
  active: ActiveUniverse | null;
  setActive: (u: ActiveUniverse | null) => void;
}

const ActiveUniverseContext = React.createContext<Ctx>({
  active: null,
  setActive: () => {},
});

const KEY = "ss_active_universe";

export function ActiveUniverseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [active, setActiveState] = React.useState<ActiveUniverse | null>(() => {
    if (typeof localStorage === "undefined") return null;
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as ActiveUniverse) : null;
    } catch {
      return null;
    }
  });

  const setActive = React.useCallback((u: ActiveUniverse | null) => {
    setActiveState(u);
    try {
      if (u) localStorage.setItem(KEY, JSON.stringify(u));
      else localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const value = React.useMemo(() => ({ active, setActive }), [active, setActive]);
  return (
    <ActiveUniverseContext.Provider value={value}>
      {children}
    </ActiveUniverseContext.Provider>
  );
}

export function useActiveUniverse() {
  return React.useContext(ActiveUniverseContext);
}

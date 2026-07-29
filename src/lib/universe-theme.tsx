import * as React from "react";

export interface UniverseTheme {
  background?: string | null;
  backgroundImage?: string | null;
  textColor?: string | null;
  accent?: string | null;
  font?: string | null;
}

/** A universe reduced to what the switcher / theming needs. */
export interface ActiveUniverse {
  id: string;
  slug: string;
  name: string;
  theme: UniverseTheme;
}

interface Ctx {
  active: ActiveUniverse | null;
  setActive: (u: ActiveUniverse | null) => void;
  saved: ActiveUniverse[];
  toggleSaved: (u: ActiveUniverse) => void;
  isSaved: (id: string) => boolean;
}

const UniverseContext = React.createContext<Ctx>({
  active: null,
  setActive: () => {},
  saved: [],
  toggleSaved: () => {},
  isSaved: () => false,
});

const ACTIVE_KEY = "ss_active_universe";
const SAVED_KEY = "ss_saved_universes";

function read<T>(key: string, fallback: T): T {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function ActiveUniverseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [active, setActiveState] = React.useState<ActiveUniverse | null>(() =>
    read<ActiveUniverse | null>(ACTIVE_KEY, null),
  );
  const [saved, setSaved] = React.useState<ActiveUniverse[]>(() =>
    read<ActiveUniverse[]>(SAVED_KEY, []),
  );

  const setActive = React.useCallback((u: ActiveUniverse | null) => {
    setActiveState(u);
    write(ACTIVE_KEY, u);
  }, []);

  const toggleSaved = React.useCallback((u: ActiveUniverse) => {
    setSaved((prev) => {
      const next = prev.some((x) => x.id === u.id)
        ? prev.filter((x) => x.id !== u.id)
        : [...prev, u];
      write(SAVED_KEY, next);
      return next;
    });
  }, []);

  const isSaved = React.useCallback(
    (id: string) => saved.some((x) => x.id === id),
    [saved],
  );

  const value = React.useMemo(
    () => ({ active, setActive, saved, toggleSaved, isSaved }),
    [active, setActive, saved, toggleSaved, isSaved],
  );
  return (
    <UniverseContext.Provider value={value}>
      {children}
    </UniverseContext.Provider>
  );
}

export function useActiveUniverse() {
  return React.useContext(UniverseContext);
}

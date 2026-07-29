import * as React from "react";

export interface UniverseTheme {
  background?: string | null;
  textColor?: string | null;
  accent?: string | null;
  font?: string | null;
}

interface Ctx {
  theme: UniverseTheme | null;
  setTheme: (t: UniverseTheme | null) => void;
}

const UniverseThemeContext = React.createContext<Ctx>({
  theme: null,
  setTheme: () => {},
});

export function UniverseThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setTheme] = React.useState<UniverseTheme | null>(null);
  const value = React.useMemo(() => ({ theme, setTheme }), [theme]);
  return (
    <UniverseThemeContext.Provider value={value}>
      {children}
    </UniverseThemeContext.Provider>
  );
}

export function useUniverseTheme() {
  return React.useContext(UniverseThemeContext);
}

/** Applies a universe theme while mounted; clears it on unmount. */
export function useApplyUniverseTheme(theme: UniverseTheme | null | undefined) {
  const { setTheme } = useUniverseTheme();
  React.useEffect(() => {
    setTheme(theme ?? null);
    return () => setTheme(null);
  }, [theme, setTheme]);
}

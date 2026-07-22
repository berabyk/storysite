import * as React from "react";
import { useParams } from "react-router-dom";
import { DEFAULT_LOCALE, getDictionary, isLocale } from "./i18n";
import type { Locale } from "./types";

export function useLocale(): Locale {
  const { lang } = useParams();
  return isLocale(lang) ? lang : DEFAULT_LOCALE;
}

export function useDict() {
  return getDictionary(useLocale());
}

/** Minimal async-data hook for reading generated content. */
export function useAsync<T>(
  fn: () => Promise<T>,
  deps: React.DependencyList,
): { data: T | undefined; loading: boolean } {
  const [data, setData] = React.useState<T>();
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    fn().then((result) => {
      if (active) {
        setData(result);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading };
}

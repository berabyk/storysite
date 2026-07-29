import * as React from "react";
import { Search as SearchIcon, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { StoryCard } from "@/components/story-card";
import { getStories } from "@/lib/content";
import { useAsync, useLocale } from "@/lib/hooks";

const T = {
  tr: {
    title: "Hikâye ara",
    placeholder: "Başlık ya da özet içinde ara…",
    hint: "Aramak için yazmaya başla.",
    noResults: "Aramanla eşleşen hikâye bulunamadı.",
    resultsFor: "sonuçlar",
  },
  en: {
    title: "Search stories",
    placeholder: "Search titles and summaries…",
    hint: "Start typing to search.",
    noResults: "No stories match your search.",
    resultsFor: "results",
  },
} as const;

export function SearchPage() {
  const locale = useLocale();
  const t = T[locale];
  const [params, setParams] = useSearchParams();
  const initial = params.get("q") ?? "";

  const [term, setTerm] = React.useState(initial);
  const [query, setQuery] = React.useState(initial);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Keep the URL (?q=) in sync with a debounced term.
  React.useEffect(() => {
    const h = setTimeout(() => {
      setQuery(term.trim());
      setParams(term.trim() ? { q: term.trim() } : {}, { replace: true });
    }, 250);
    return () => clearTimeout(h);
  }, [term, setParams]);

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const { data: results, loading } = useAsync(
    () => (query ? getStories(locale, { q: query }) : Promise.resolve([])),
    [locale, query],
  );

  const stories = results ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="font-serif mb-6 text-3xl font-semibold sm:text-4xl">
        {t.title}
      </h1>

      <div className="relative mb-8 max-w-xl">
        <SearchIcon className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
        <Input
          ref={inputRef}
          type="search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={t.placeholder}
          aria-label={t.title}
          className="pl-9 pr-9"
        />
        {term && (
          <button
            type="button"
            onClick={() => setTerm("")}
            className="text-muted-foreground hover:text-foreground absolute right-2.5 top-1/2 -translate-y-1/2"
            aria-label="temizle"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {!query ? (
        <p className="text-muted-foreground py-12 text-center">{t.hint}</p>
      ) : loading ? (
        <div className="grid gap-6 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[16/10] w-full rounded-xl" />
              <Skeleton className="h-6 w-2/3" />
            </div>
          ))}
        </div>
      ) : stories.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center">{t.noResults}</p>
      ) : (
        <>
          <p className="text-muted-foreground mb-4 text-sm">
            {stories.length} {t.resultsFor}
          </p>
          <div className="grid gap-6 sm:grid-cols-2">
            {stories.map((s) => (
              <StoryCard key={s.id} story={s} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

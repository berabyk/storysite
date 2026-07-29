import * as React from "react";
import { Search as SearchIcon, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StoryCard } from "@/components/story-card";
import { cn } from "@/lib/utils";
import { getStories } from "@/lib/content";
import { useAsync, useLocale } from "@/lib/hooks";
import type { Locale } from "@/lib/types";

const T = {
  tr: {
    title: "Hikâye ara",
    placeholder: "Başlık ya da özet içinde ara…",
    hint: "Aramak için yazmaya başla ya da bir filtre seç.",
    noResults: "Eşleşen hikâye bulunamadı.",
    results: "sonuç",
    language: "Dil",
    all: "Hepsi",
    tr: "Türkçe",
    en: "English",
    tag: "Etiket",
    genre: "Tür",
  },
  en: {
    title: "Search stories",
    placeholder: "Search titles and summaries…",
    hint: "Start typing or pick a filter.",
    noResults: "No stories match.",
    results: "results",
    language: "Language",
    all: "All",
    tr: "Türkçe",
    en: "English",
    tag: "Tag",
    genre: "Genre",
  },
} as const;

export function SearchPage() {
  const locale = useLocale();
  const t = T[locale];
  const [params, setParams] = useSearchParams();

  const tag = params.get("tag") ?? "";
  const genre = params.get("genre") ?? "";
  const [term, setTerm] = React.useState(params.get("q") ?? "");
  const [query, setQuery] = React.useState(params.get("q") ?? "");
  const [lang, setLang] = React.useState<Locale | "all">(locale);

  // Debounce the free-text term into the query + URL.
  React.useEffect(() => {
    const h = setTimeout(() => {
      setQuery(term.trim());
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (term.trim()) next.set("q", term.trim());
          else next.delete("q");
          return next;
        },
        { replace: true },
      );
    }, 250);
    return () => clearTimeout(h);
  }, [term, setParams]);

  const active = Boolean(query || tag || genre);

  const { data: results, loading } = useAsync(
    () =>
      active
        ? getStories(locale, {
            q: query || undefined,
            tag: tag || undefined,
            genre: genre || undefined,
            language: lang,
          })
        : Promise.resolve([]),
    [locale, query, tag, genre, lang],
  );

  const stories = results ?? [];

  const clearParam = (key: string) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete(key);
        return next;
      },
      { replace: true },
    );

  const langs: (Locale | "all")[] = ["all", "tr", "en"];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="font-serif mb-6 text-3xl font-semibold sm:text-4xl">
        {t.title}
      </h1>

      <div className="mb-4 max-w-xl">
        <div className="relative">
          <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            type="search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder={t.placeholder}
            aria-label={t.title}
            className="pr-9 pl-9"
          />
          {term && (
            <button
              type="button"
              onClick={() => setTerm("")}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2"
              aria-label="temizle"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground text-sm">{t.language}:</span>
        {langs.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLang(l)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              lang === l
                ? "bg-primary text-primary-foreground border-transparent"
                : "hover:bg-accent",
            )}
          >
            {l === "all" ? t.all : l === "tr" ? t.tr : t.en}
          </button>
        ))}
        {tag && (
          <Badge variant="soft" className="gap-1">
            {t.tag}: #{tag}
            <button type="button" onClick={() => clearParam("tag")} aria-label="x">
              <X className="size-3" />
            </button>
          </Badge>
        )}
        {genre && (
          <Badge variant="soft" className="gap-1">
            {t.genre}: {genre}
            <button type="button" onClick={() => clearParam("genre")} aria-label="x">
              <X className="size-3" />
            </button>
          </Badge>
        )}
      </div>

      {!active ? (
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
            {stories.length} {t.results}
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

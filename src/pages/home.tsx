import * as React from "react";
import { ArrowRight, BookOpen, Search, Users, X } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { StoryCard } from "@/components/story-card";
import { getStories } from "@/lib/content";
import { useAsync, useDict, useLocale } from "@/lib/hooks";
import type { StorySummary } from "@/lib/types";

const norm = (s: string) => s.toLocaleLowerCase("tr").trim();

function matches(story: StorySummary, q: string): boolean {
  const hay = norm(
    [story.title, story.explanation, ...(story.characters ?? [])].join(" "),
  );
  return norm(q)
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => hay.includes(term));
}

export function HomePage() {
  const locale = useLocale();
  const dict = useDict();
  const { data: stories, loading } = useAsync(() => getStories(locale), [
    locale,
  ]);

  const [query, setQuery] = React.useState("");
  const searching = query.trim().length > 0;

  const all = stories ?? [];
  const featured = all[0];
  const rest = all.slice(1);
  const filtered = searching ? all.filter((s) => matches(s, query)) : rest;

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-5xl px-4 pt-16 pb-10 sm:px-6 sm:pt-24 sm:pb-14 text-center">
          <p className="text-primary mb-4 text-sm font-medium tracking-[0.2em] uppercase">
            {dict.home.heroKicker}
          </p>
          <h1 className="font-serif text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-6xl">
            {dict.home.heroTitle}
          </h1>
          <p className="text-muted-foreground mx-auto mt-6 max-w-xl text-lg leading-relaxed text-pretty">
            {dict.home.heroSubtitle}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <a href="#stories">
                <BookOpen /> {dict.home.browseStories}
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to={`/${locale}/characters`}>
                <Users /> {dict.home.meetCharacters}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured story */}
      {!loading && featured && !searching && (
        <section className="mx-auto max-w-5xl px-4 sm:px-6">
          <Link
            to={`/${locale}/stories/${featured.slug}`}
            className="group border-border/70 bg-card relative grid overflow-hidden rounded-2xl border shadow-sm transition-all hover:shadow-xl md:grid-cols-2"
          >
            <div className="relative aspect-[16/10] overflow-hidden md:aspect-auto">
              <img
                src={featured.image ?? "/static/images/cover.jpg"}
                alt={featured.title}
                className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="flex flex-col justify-center gap-3 p-6 sm:p-10">
              <span className="text-primary text-xs font-medium tracking-[0.2em] uppercase">
                {dict.home.latest}
              </span>
              <h2 className="font-serif text-3xl leading-tight font-semibold sm:text-4xl">
                {featured.title}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {featured.explanation}
              </p>
              <span className="text-primary mt-2 inline-flex items-center gap-1.5 font-medium">
                {dict.actions.read}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        </section>
      )}

      {/* Stories grid */}
      <section id="stories" className="mx-auto max-w-5xl scroll-mt-20 px-4 py-14 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="font-serif text-2xl font-semibold sm:text-3xl">
            {dict.home.allStories}
          </h2>
          {!loading && all.length > 0 && (
            <div className="relative w-full sm:max-w-xs">
              <Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={dict.home.search}
                aria-label={dict.home.search}
                className="pl-9 pr-9"
              />
              {searching && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="text-muted-foreground hover:text-foreground absolute right-2.5 top-1/2 -translate-y-1/2"
                  aria-label="temizle"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[16/10] w-full rounded-xl" />
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        ) : all.length === 0 ? (
          <p className="text-muted-foreground py-16 text-center">
            {dict.home.empty}
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground py-16 text-center">
            {dict.home.noResults}
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {filtered.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

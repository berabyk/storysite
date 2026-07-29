import * as React from "react";
import { useParams } from "react-router-dom";
import { UserRound } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { StoryCard } from "@/components/story-card";
import { getStories } from "@/lib/content";
import { useAsync, useLocale } from "@/lib/hooks";

const T = {
  tr: {
    stories: "hikâye",
    empty: "Bu yazarın yayımlanmış hikâyesi yok.",
    by: "Yazar",
  },
  en: {
    stories: "stories",
    empty: "This author has no published stories.",
    by: "Author",
  },
} as const;

export function AuthorPage() {
  const locale = useLocale();
  const t = T[locale];
  const { userName = "" } = useParams();

  const { data: stories, loading } = useAsync(
    () => getStories(locale, { author: userName }),
    [locale, userName],
  );

  const list = stories ?? [];
  const displayName = list[0]?.authorName ?? userName;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="mb-10 flex items-center gap-4">
        <div className="bg-primary/12 text-primary flex size-16 items-center justify-center rounded-full">
          <UserRound className="size-8" />
        </div>
        <div>
          <p className="text-muted-foreground text-xs tracking-[0.15em] uppercase">
            {t.by}
          </p>
          <h1 className="font-serif text-3xl font-semibold sm:text-4xl">
            {displayName}
          </h1>
          {!loading && (
            <p className="text-muted-foreground text-sm">
              {list.length} {t.stories}
            </p>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[16/10] w-full rounded-xl" />
              <Skeleton className="h-6 w-2/3" />
            </div>
          ))}
        </div>
      ) : list.length === 0 ? (
        <p className="text-muted-foreground py-16 text-center">{t.empty}</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {list.map((s) => (
            <StoryCard key={s.id} story={s} />
          ))}
        </div>
      )}
    </div>
  );
}

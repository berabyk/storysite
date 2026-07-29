import * as React from "react";
import { Navigate } from "react-router-dom";
import { Bookmark } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { StoryCard } from "@/components/story-card";
import { getSavedStories } from "@/lib/content";
import { useAuth } from "@/lib/auth";
import { useLocale } from "@/lib/hooks";
import type { StorySummary } from "@/lib/types";

export function SavedPage() {
  const locale = useLocale();
  const { user, loading: authLoading } = useAuth();
  const [stories, setStories] = React.useState<StorySummary[] | null>(null);

  const t =
    locale === "tr"
      ? { title: "Kaydedilenler", empty: "Henüz hikâye kaydetmedin." }
      : { title: "Saved", empty: "You haven't saved any stories yet." };

  React.useEffect(() => {
    if (user) getSavedStories().then(setStories);
  }, [user]);

  if (!authLoading && !user) return <Navigate to={`/${locale}/login`} replace />;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="font-serif mb-8 flex items-center gap-2 text-3xl font-semibold sm:text-4xl">
        <Bookmark className="size-7" /> {t.title}
      </h1>

      {stories === null ? (
        <div className="grid gap-6 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full rounded-xl" />
          ))}
        </div>
      ) : stories.length === 0 ? (
        <p className="text-muted-foreground py-16 text-center">{t.empty}</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {stories.map((s) => (
            <StoryCard key={s.id} story={s} />
          ))}
        </div>
      )}
    </div>
  );
}

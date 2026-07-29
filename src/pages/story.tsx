import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StoryContent } from "@/components/story-content";
import { getStory } from "@/lib/content";
import { formatDate } from "@/lib/utils";
import { useAsync, useDict, useLocale } from "@/lib/hooks";

export function StoryPage() {
  const locale = useLocale();
  const dict = useDict();
  const { slug = "" } = useParams();

  const { data: story, loading } = useAsync(() => getStory(locale, slug), [
    locale,
    slug,
  ]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <Skeleton className="mb-6 h-10 w-3/4" />
        <Skeleton className="mb-8 aspect-[21/9] w-full rounded-xl" />
        <div className="space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
        <h1 className="font-serif text-3xl font-semibold">
          {dict.story.notFound}
        </h1>
        <p className="text-muted-foreground mt-3">{dict.story.notFoundBody}</p>
        <Button asChild className="mt-8">
          <Link to={`/${locale}`}>
            <ArrowLeft /> {dict.story.back}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <article className="pb-10">
      {/* Banner */}
      {story.image && (
        <div className="relative mx-auto mt-6 aspect-[21/9] w-full max-w-5xl overflow-hidden rounded-2xl px-0 sm:mt-8">
          <img
            src={story.image}
            alt={story.title}
            className="size-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      )}

      <header className="mx-auto max-w-3xl px-4 pt-10 pb-8 text-center sm:px-6">
        <Link
          to={`/${locale}`}
          className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="size-4" /> {dict.story.back}
        </Link>
        {story.createdTime && (
          <p className="text-primary mb-3 text-sm tracking-wide">
            {formatDate(story.createdTime, locale)}
          </p>
        )}
        <h1 className="font-serif text-4xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-5xl">
          {story.title}
        </h1>
        {story.explanation && (
          <p className="text-muted-foreground mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-pretty">
            {story.explanation}
          </p>
        )}
      </header>

      <StoryContent document={story.content} className="px-4 sm:px-6" />
    </article>
  );
}

import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StoryContent } from "@/components/story-content";
import { StoryEngagement } from "@/components/story-engagement";
import { getCharacters, getStory } from "@/lib/content";
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
  const { data: allCharacters } = useAsync(() => getCharacters(locale), [
    locale,
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
        <p className="text-primary mb-3 text-sm tracking-wide">
          {story.createdTime && formatDate(story.createdTime, locale)}
          {story.authorUserName && (
            <>
              {story.createdTime && " · "}
              <Link
                to={`/${locale}/author/${story.authorUserName}`}
                className="hover:underline"
              >
                {story.authorName}
              </Link>
            </>
          )}
        </p>
        <h1 className="font-serif text-4xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-5xl">
          {story.title}
        </h1>
        {story.explanation && (
          <p className="text-muted-foreground mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-pretty">
            {story.explanation}
          </p>
        )}
        <div className="mt-6">
          <StoryEngagement story={story} />
        </div>
      </header>

      <StoryContent document={story.content} className="px-4 sm:px-6" />

      {(() => {
        const attached = (allCharacters ?? []).filter((c) =>
          story.characters?.includes(c.slug),
        );
        if (attached.length === 0) return null;
        return (
          <section className="mx-auto mt-14 max-w-3xl px-4 sm:px-6">
            <h2 className="font-serif mb-4 text-xl font-semibold">
              {locale === "tr" ? "Karakterler" : "Characters"}
            </h2>
            <div className="flex flex-wrap gap-3">
              {attached.map((c) => (
                <Link
                  key={c.id}
                  to={`/${locale}/characters/${c.slug}`}
                  className="hover:bg-accent flex items-center gap-2 rounded-full border py-1 pr-3 pl-1 transition-colors"
                >
                  {c.image ? (
                    <img
                      src={c.image}
                      alt=""
                      className="size-7 rounded-full object-cover"
                    />
                  ) : (
                    <span className="bg-muted size-7 rounded-full" />
                  )}
                  <span className="text-sm">{c.name}</span>
                </Link>
              ))}
            </div>
          </section>
        );
      })()}
    </article>
  );
}

import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { StoryCard } from "@/components/story-card";
import { StoryContent } from "@/components/story-content";
import { getCharacter } from "@/lib/content";
import { useAsync, useDict, useLocale } from "@/lib/hooks";

const FALLBACK = "/static/images/cover.jpg";

export function CharacterPage() {
  const locale = useLocale();
  const dict = useDict();
  const { slug = "" } = useParams();

  const { data: character, loading } = useAsync(
    () => getCharacter(locale, slug),
    [locale, slug],
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-[280px_1fr]">
          <Skeleton className="aspect-[3/4] w-full rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
        <h1 className="font-serif text-3xl font-semibold">
          {dict.character.notFound}
        </h1>
        <Button asChild className="mt-8">
          <Link to={`/${locale}/characters`}>
            <ArrowLeft /> {dict.character.back}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <Link
        to={`/${locale}/characters`}
        className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
      >
        <ArrowLeft className="size-4" /> {dict.character.back}
      </Link>

      {/* Profile */}
      <div className="grid gap-8 sm:grid-cols-[300px_1fr] sm:items-start">
        <div className="relative mx-auto w-full max-w-[300px] overflow-hidden rounded-2xl shadow-lg">
          <img
            src={character.image ?? FALLBACK}
            alt={character.name}
            className="aspect-[3/4] w-full object-cover"
          />
        </div>

        <div className="flex flex-col gap-4 sm:pt-4">
          {character.kind && <Badge variant="soft">{character.kind}</Badge>}
          <h1 className="font-serif text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
            {character.name}
          </h1>
          {character.explanation && (
            <p className="text-muted-foreground text-lg leading-relaxed">
              {character.explanation}
            </p>
          )}
        </div>
      </div>

      {/* Bio / content */}
      {(character.content?.blocks?.length ?? 0) > 0 && (
        <>
          <Separator className="my-12" />
          <StoryContent document={character.content} />
        </>
      )}

      {/* Appears in */}
      <Separator className="my-12" />
      <section>
        <h2 className="font-serif mb-6 text-2xl font-semibold sm:text-3xl">
          {dict.character.appearsIn}
        </h2>
        {character.stories && character.stories.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2">
            {character.stories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">{dict.character.noStories}</p>
        )}
      </section>
    </div>
  );
}

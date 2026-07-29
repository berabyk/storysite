import { ArrowLeft, BookOpen, Globe2, Users } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { StoryCard } from "@/components/story-card";
import { CharacterCard } from "@/components/character-card";
import { getUniverse } from "@/lib/universes";
import { useAsync, useLocale } from "@/lib/hooks";

export function UniversePage() {
  const locale = useLocale();
  const { slug = "" } = useParams();
  const { data: universe, loading } = useAsync(
    () => getUniverse(locale, slug),
    [locale, slug],
  );

  const t =
    locale === "tr"
      ? {
          back: "Evrenler",
          by: "Oluşturan",
          stories: "Hikâyeler",
          characters: "Karakterler",
          noStories: "Bu evrende henüz hikâye yok.",
          noCharacters: "Bu evrende henüz karakter yok.",
          notFound: "Evren bulunamadı.",
        }
      : {
          back: "Universes",
          by: "Created by",
          stories: "Stories",
          characters: "Characters",
          noStories: "No stories in this universe yet.",
          noCharacters: "No characters in this universe yet.",
          notFound: "Universe not found.",
        };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <Skeleton className="mb-6 h-40 w-full rounded-2xl" />
        <Skeleton className="h-8 w-1/2" />
      </div>
    );
  }

  if (!universe) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
        <h1 className="font-serif text-3xl font-semibold">{t.notFound}</h1>
        <Button asChild className="mt-8">
          <Link to={`/${locale}/universes`}>
            <ArrowLeft /> {t.back}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link
        to={`/${locale}/universes`}
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1.5 text-sm font-medium"
      >
        <ArrowLeft className="size-4" /> {t.back}
      </Link>

      <div className="border-border/70 bg-card relative overflow-hidden rounded-2xl border">
        {universe.coverImageUrl && (
          <div className="relative aspect-[21/7] w-full overflow-hidden">
            <img
              src={universe.coverImageUrl}
              alt=""
              className="size-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
        )}
        <div className="p-6 sm:p-8">
          <span className="text-primary inline-flex items-center gap-1.5 text-xs font-medium tracking-[0.15em] uppercase">
            <Globe2 className="size-3.5" /> {locale === "tr" ? "Evren" : "Universe"}
          </span>
          <h1 className="font-serif mt-2 text-3xl font-semibold sm:text-4xl">
            {universe.name}
          </h1>
          {universe.description && (
            <p className="text-muted-foreground mt-3 max-w-2xl leading-relaxed whitespace-pre-wrap">
              {universe.description}
            </p>
          )}
          <p className="text-muted-foreground mt-4 text-sm">
            {t.by}{" "}
            <Link
              to={`/${locale}/author/${universe.owner.userName}`}
              className="text-primary hover:underline"
            >
              {universe.owner.displayName}
            </Link>
          </p>
        </div>
      </div>

      {/* Stories */}
      <section className="mt-12">
        <h2 className="font-serif mb-6 flex items-center gap-2 text-2xl font-semibold">
          <BookOpen className="size-5" /> {t.stories}
          <span className="text-muted-foreground text-base">
            ({universe.stories.length})
          </span>
        </h2>
        {universe.stories.length === 0 ? (
          <p className="text-muted-foreground">{t.noStories}</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {universe.stories.map((s) => (
              <StoryCard key={s.id} story={s} />
            ))}
          </div>
        )}
      </section>

      <Separator className="my-12" />

      {/* Characters */}
      <section>
        <h2 className="font-serif mb-6 flex items-center gap-2 text-2xl font-semibold">
          <Users className="size-5" /> {t.characters}
          <span className="text-muted-foreground text-base">
            ({universe.characters.length})
          </span>
        </h2>
        {universe.characters.length === 0 ? (
          <p className="text-muted-foreground">{t.noCharacters}</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {universe.characters.map((c) => (
              <CharacterCard key={c.id} character={c} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

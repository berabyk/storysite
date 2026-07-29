import * as React from "react";
import { ArrowLeft, Flag, Pin, PinOff } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StoryContent } from "@/components/story-content";
import { StoryEngagement } from "@/components/story-engagement";
import { Globe2 } from "lucide-react";
import { getCharacters, getStory } from "@/lib/content";
import { listUniverses } from "@/lib/universes";
import { pinStory, unpinStory } from "@/lib/author";
import { isAdmin } from "@/lib/characters";
import { reportStory } from "@/lib/moderation";
import { useAuth } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { useAsync, useDict, useLocale } from "@/lib/hooks";

const LANG_LABEL: Record<string, string> = { tr: "Türkçe", en: "English" };

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
  const { data: universes } = useAsync(() => listUniverses(locale), [locale]);

  const { user } = useAuth();
  const admin = isAdmin(user?.roles);
  const [pinned, setPinned] = React.useState(false);
  const [reported, setReported] = React.useState(false);
  React.useEffect(() => setPinned(Boolean(story?.pinned)), [story]);

  async function togglePin() {
    if (!story) return;
    try {
      if (pinned) await unpinStory(story.id);
      else await pinStory(story.id);
      setPinned(!pinned);
    } catch {
      /* ignore */
    }
  }

  async function onReport() {
    if (!story || reported) return;
    const reason =
      window.prompt(
        locale === "tr"
          ? "Neden bildiriyorsun? (kısaca)"
          : "Why are you reporting this? (briefly)",
      ) ?? "";
    try {
      await reportStory(story.id, reason.trim() || "—");
      setReported(true);
    } catch {
      /* ignore */
    }
  }

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
          {(story.coauthors ?? []).map((a) => (
            <React.Fragment key={a.id}>
              {", "}
              <Link
                to={`/${locale}/author/${a.userName}`}
                className="hover:underline"
              >
                {a.displayName}
              </Link>
            </React.Fragment>
          ))}
        </p>
        <h1 className="font-serif text-4xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-5xl">
          {story.title}
        </h1>
        {story.explanation && (
          <p className="text-muted-foreground mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-pretty">
            {story.explanation}
          </p>
        )}

        {/* Badges: universe, language, genre, tags */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {(() => {
            const u = (universes ?? []).find((x) => x.id === story.universeId);
            return u ? (
              <Link to={`/${locale}/universe/${u.slug}`}>
                <Badge variant="soft" className="gap-1">
                  <Globe2 className="size-3" /> {u.name}
                </Badge>
              </Link>
            ) : null;
          })()}
          {story.language && (
            <Badge variant="secondary">
              {LANG_LABEL[story.language] ?? story.language}
            </Badge>
          )}
          {story.genre && <Badge variant="soft">{story.genre}</Badge>}
          {(story.tags ?? []).map((tag) => (
            <Link key={tag} to={`/${locale}/search?tag=${encodeURIComponent(tag)}`}>
              <Badge variant="outline" className="hover:bg-accent">
                #{tag}
              </Badge>
            </Link>
          ))}
        </div>

        <div className="mt-6 flex flex-col items-center gap-3">
          <StoryEngagement story={story} />
          <div className="flex items-center gap-2">
            {admin && (
              <Button variant="outline" size="sm" onClick={togglePin}>
                {pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
                {pinned
                  ? locale === "tr"
                    ? "Sabitlemeyi kaldır"
                    : "Unpin"
                  : locale === "tr"
                    ? "Ana sayfada sabitle"
                    : "Pin to home"}
              </Button>
            )}
            {user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReport}
                disabled={reported}
                className="text-muted-foreground"
              >
                <Flag className="size-4" />
                {reported
                  ? locale === "tr"
                    ? "Bildirildi"
                    : "Reported"
                  : locale === "tr"
                    ? "Bildir"
                    : "Report"}
              </Button>
            )}
          </div>
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

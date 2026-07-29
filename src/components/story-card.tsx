import { ArrowRight, Bookmark, Eye } from "lucide-react";
import { Link } from "react-router-dom";

import { Card } from "@/components/ui/card";
import { cn, formatDate } from "@/lib/utils";
import { useDict, useLocale } from "@/lib/hooks";
import type { StorySummary } from "@/lib/types";

const FALLBACK = "/static/images/cover.jpg";

export function StoryCard({
  story,
  className,
}: {
  story: StorySummary;
  className?: string;
}) {
  const locale = useLocale();
  const dict = useDict();

  return (
    <Card
      className={cn(
        "group overflow-hidden pt-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
        className,
      )}
    >
      <Link
        to={`/${locale}/stories/${story.slug}`}
        className="flex h-full flex-col"
      >
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={story.image ?? FALLBACK}
            alt={story.title}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        </div>

        <div className="flex flex-1 flex-col gap-2 p-5">
          {story.createdTime && (
            <time className="text-muted-foreground text-xs tracking-wide uppercase">
              {formatDate(story.createdTime, locale)}
            </time>
          )}
          <h3 className="font-serif text-2xl leading-tight font-semibold transition-colors group-hover:text-primary">
            {story.title}
          </h3>
          <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">
            {story.explanation}
          </p>
          <div className="mt-auto flex items-center justify-between pt-2">
            <span className="text-primary inline-flex items-center gap-1.5 text-sm font-medium">
              {dict.actions.read}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </span>
            <span className="text-muted-foreground flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1">
                <Eye className="size-3.5" /> {story.viewCount ?? 0}
              </span>
              <span className="inline-flex items-center gap-1">
                <Bookmark className="size-3.5" /> {story.likeCount ?? 0}
              </span>
            </span>
          </div>
        </div>
      </Link>
    </Card>
  );
}

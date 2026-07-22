import { Link } from "react-router-dom";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/hooks";
import type { CharacterSummary } from "@/lib/types";

const FALLBACK = "/static/images/cover.jpg";

export function CharacterCard({
  character,
  className,
}: {
  character: CharacterSummary;
  className?: string;
}) {
  const locale = useLocale();

  return (
    <Card
      className={cn(
        "group relative overflow-hidden border-0 p-0 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
        className,
      )}
    >
      <Link to={`/${locale}/characters/${character.slug}`}>
        <div className="relative aspect-[3/4] overflow-hidden">
          <img
            src={character.image ?? FALLBACK}
            alt={character.name}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4">
            {character.kind && (
              <Badge variant="soft" className="mb-2 backdrop-blur-sm">
                {character.kind}
              </Badge>
            )}
            <h3 className="font-serif text-xl leading-tight font-semibold text-white">
              {character.name}
            </h3>
            {character.explanation && (
              <p className="mt-1 line-clamp-2 text-sm text-white/75">
                {character.explanation}
              </p>
            )}
          </div>
        </div>
      </Link>
    </Card>
  );
}

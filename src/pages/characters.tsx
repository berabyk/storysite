import { Skeleton } from "@/components/ui/skeleton";
import { CharacterCard } from "@/components/character-card";
import { getCharacters } from "@/lib/content";
import { useActiveUniverse } from "@/lib/universe-theme";
import { useAsync, useDict, useLocale } from "@/lib/hooks";

export function CharactersPage() {
  const locale = useLocale();
  const dict = useDict();
  const { active } = useActiveUniverse();
  const { data: characters, loading } = useAsync(
    () => getCharacters(locale, active?.id),
    [locale, active?.id],
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <header className="mb-10 text-center">
        <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
          {dict.charactersPage.title}
        </h1>
        <p className="text-muted-foreground mt-4 text-lg">
          {dict.charactersPage.subtitle}
        </p>
      </header>

      {loading ? (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] w-full rounded-xl" />
          ))}
        </div>
      ) : characters && characters.length > 0 ? (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {characters.map((character) => (
            <CharacterCard key={character.id} character={character} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground py-16 text-center">
          {dict.charactersPage.empty}
        </p>
      )}
    </div>
  );
}

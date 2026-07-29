import * as React from "react";
import { Check, ChevronDown, Globe2, Search, Star } from "lucide-react";

import { listUniverses, type UniverseListItem } from "@/lib/universes";
import {
  useActiveUniverse,
  type ActiveUniverse,
} from "@/lib/universe-theme";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/types";

/** Reduce a fetched list item to the shape stored in context. */
function toActive(u: UniverseListItem): ActiveUniverse {
  return { id: u.id, slug: u.slug, name: u.name, theme: u.theme };
}

export function UniverseSwitcher({ locale }: { locale: Locale }) {
  const { active, setActive, saved, toggleSaved, isSaved } =
    useActiveUniverse();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [all, setAll] = React.useState<UniverseListItem[] | null>(null);

  const tr = locale === "tr";

  // Load the full list lazily the first time the dialog opens (for search).
  React.useEffect(() => {
    if (open && all === null) {
      listUniverses(locale).then(setAll);
    }
  }, [open, all, locale]);

  const q = query.trim().toLocaleLowerCase(locale === "tr" ? "tr" : "en");

  // With no query we show the user's saved universes; with a query we search
  // across every universe.
  const results: UniverseListItem[] = React.useMemo(() => {
    if (q) {
      return (all ?? []).filter((u) =>
        `${u.name} ${u.owner.displayName} ${u.owner.userName}`
          .toLocaleLowerCase(locale === "tr" ? "tr" : "en")
          .includes(q),
      );
    }
    return [];
  }, [q, all, locale]);

  function choose(u: ActiveUniverse | null) {
    setActive(u);
    setOpen(false);
    setQuery("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={active ? "secondary" : "ghost"} size="sm" className="ml-1 gap-1.5">
          <Globe2 className="size-4" />
          <span className="max-w-[9rem] truncate">
            {active ? active.name : tr ? "Tüm evrenler" : "All universes"}
          </span>
          <ChevronDown className="size-3.5 opacity-60" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md gap-0 p-0">
        <DialogHeader className="mb-0 border-b p-4">
          <DialogTitle>{tr ? "Evren seç" : "Choose a universe"}</DialogTitle>
        </DialogHeader>

        <div className="p-3">
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tr ? "Evrenlerde ara…" : "Search universes…"}
              className="pl-8"
            />
          </div>
        </div>

        <ScrollArea className="max-h-[50vh]">
          <div className="flex flex-col px-2 pb-3">
            {/* Clear the active universe */}
            <button
              type="button"
              onClick={() => choose(null)}
              className="hover:bg-accent flex items-center gap-2 rounded-md px-2 py-2 text-left text-sm"
            >
              <Check className={cn("size-4 shrink-0", active && "opacity-0")} />
              <Globe2 className="size-4 shrink-0 opacity-70" />
              <span className="flex-1">
                {tr ? "Tüm evrenler" : "All universes"}
              </span>
            </button>

            {/* Query mode: search results. Otherwise: saved universes. */}
            {q ? (
              <>
                <p className="text-muted-foreground px-2 pt-3 pb-1 text-xs font-medium">
                  {tr ? "Sonuçlar" : "Results"}
                </p>
                {all === null ? (
                  <p className="text-muted-foreground px-2 py-3 text-sm">
                    {tr ? "Yükleniyor…" : "Loading…"}
                  </p>
                ) : results.length === 0 ? (
                  <p className="text-muted-foreground px-2 py-3 text-sm">
                    {tr ? "Evren bulunamadı." : "No universes found."}
                  </p>
                ) : (
                  results.map((u) => (
                    <Row
                      key={u.id}
                      universe={u}
                      active={active?.id === u.id}
                      saved={isSaved(u.id)}
                      onSelect={() => choose(toActive(u))}
                      onToggleSave={() => toggleSaved(toActive(u))}
                    />
                  ))
                )}
              </>
            ) : (
              <>
                <p className="text-muted-foreground px-2 pt-3 pb-1 text-xs font-medium">
                  {tr ? "Kaydettiğim evrenler" : "My saved universes"}
                </p>
                {saved.length === 0 ? (
                  <p className="text-muted-foreground px-2 py-3 text-sm">
                    {tr
                      ? "Henüz kaydedilen evren yok. Aramak için yukarıya yazın."
                      : "No saved universes yet. Type above to search."}
                  </p>
                ) : (
                  saved.map((u) => (
                    <SavedRow
                      key={u.id}
                      universe={u}
                      active={active?.id === u.id}
                      onSelect={() => choose(u)}
                      onToggleSave={() => toggleSaved(u)}
                    />
                  ))
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function Row({
  universe,
  active,
  saved,
  onSelect,
  onToggleSave,
}: {
  universe: UniverseListItem;
  active: boolean;
  saved: boolean;
  onSelect: () => void;
  onToggleSave: () => void;
}) {
  return (
    <div className="hover:bg-accent group flex items-center gap-2 rounded-md px-2 py-2">
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
      >
        <Check className={cn("size-4 shrink-0", !active && "opacity-0")} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm">{universe.name}</span>
          <span className="text-muted-foreground block truncate text-xs">
            @{universe.owner.userName} · {universe.storyCount} · {universe.characterCount}
          </span>
        </span>
      </button>
      <button
        type="button"
        onClick={onToggleSave}
        title={saved ? "Kaydı kaldır" : "Kaydet"}
        className="text-muted-foreground hover:text-foreground shrink-0 p-1"
      >
        <Star className={cn("size-4", saved && "fill-primary text-primary")} />
      </button>
    </div>
  );
}

function SavedRow({
  universe,
  active,
  onSelect,
  onToggleSave,
}: {
  universe: ActiveUniverse;
  active: boolean;
  onSelect: () => void;
  onToggleSave: () => void;
}) {
  return (
    <div className="hover:bg-accent group flex items-center gap-2 rounded-md px-2 py-2">
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
      >
        <Check className={cn("size-4 shrink-0", !active && "opacity-0")} />
        <span className="block min-w-0 flex-1 truncate text-sm">
          {universe.name}
        </span>
      </button>
      <button
        type="button"
        onClick={onToggleSave}
        title="Kaydı kaldır"
        className="text-muted-foreground hover:text-foreground shrink-0 p-1"
      >
        <Star className="fill-primary text-primary size-4" />
      </button>
    </div>
  );
}

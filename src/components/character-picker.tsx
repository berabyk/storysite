import * as React from "react";
import { Check, Search, UserPlus, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { CharacterListItem } from "@/lib/characters";
import type { Locale } from "@/lib/types";

const T = {
  tr: {
    add: "Karakter seç",
    title: "Karakterleri seç",
    search: "Karakter ara…",
    empty: "Karakter bulunamadı.",
    done: "Bitti",
    selected: "seçili",
  },
  en: {
    add: "Pick characters",
    title: "Pick characters",
    search: "Search characters…",
    empty: "No characters found.",
    done: "Done",
    selected: "selected",
  },
} as const;

export function CharacterPicker({
  characters,
  value,
  onChange,
  locale,
}: {
  characters: CharacterListItem[];
  value: string[];
  onChange: (slugs: string[]) => void;
  locale: Locale;
}) {
  const t = T[locale] ?? T.tr;
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");

  const norm = (s: string) => s.toLocaleLowerCase("tr");
  const filtered = characters.filter(
    (c) =>
      !q.trim() ||
      norm(`${c.name} ${c.kind} ${c.explanation}`).includes(norm(q.trim())),
  );

  const toggle = (slug: string) =>
    onChange(
      value.includes(slug)
        ? value.filter((s) => s !== slug)
        : [...value, slug],
    );

  const selected = characters.filter((c) => value.includes(c.slug));

  const meta = (c: CharacterListItem) =>
    [c.kind, c.age, c.pronouns].filter(Boolean).join(" · ");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              <UserPlus className="size-4" /> {t.add}
              {value.length > 0 && (
                <span className="text-muted-foreground">({value.length})</span>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.title}</DialogTitle>
            </DialogHeader>

            <div className="relative mb-3">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t.search}
                className="pl-9"
              />
            </div>

            <ScrollArea className="-mx-1 max-h-[52vh] flex-1">
              <div className="flex flex-col gap-1 px-1">
                {filtered.length === 0 ? (
                  <p className="text-muted-foreground py-8 text-center text-sm">
                    {t.empty}
                  </p>
                ) : (
                  filtered.map((c) => {
                    const on = value.includes(c.slug);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggle(c.slug)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg border p-2 text-left transition-colors",
                          on
                            ? "border-primary bg-primary/5"
                            : "border-transparent hover:bg-accent",
                        )}
                      >
                        {c.imageUrl ? (
                          <img
                            src={c.imageUrl}
                            alt=""
                            className="size-10 shrink-0 rounded-md object-cover"
                          />
                        ) : (
                          <div className="bg-muted size-10 shrink-0 rounded-md" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">{c.name}</div>
                          {meta(c) && (
                            <div className="text-muted-foreground truncate text-xs">
                              {meta(c)}
                            </div>
                          )}
                        </div>
                        <span
                          className={cn(
                            "flex size-5 shrink-0 items-center justify-center rounded-full border",
                            on
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-input",
                          )}
                        >
                          {on && <Check className="size-3.5" />}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </ScrollArea>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                {value.length} {t.selected}
              </span>
              <Button type="button" size="sm" onClick={() => setOpen(false)}>
                {t.done}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {selected.map((c) => (
          <span
            key={c.id}
            className="bg-secondary flex items-center gap-1 rounded-full py-1 pr-1 pl-3 text-sm"
          >
            {c.name}
            <button
              type="button"
              onClick={() => toggle(c.slug)}
              className="hover:bg-background/60 rounded-full p-0.5"
              aria-label="x"
            >
              <X className="size-3.5" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

import * as React from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Globe2,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { uploadImage } from "@/lib/author";
import {
  createUniverse,
  deleteUniverse,
  listMyUniverses,
  listUniverses,
  updateUniverse,
  type UniverseListItem,
} from "@/lib/universes";
import { useAuth } from "@/lib/auth";
import { useLocale } from "@/lib/hooks";

interface Form {
  id: string | null;
  name: string;
  description: string;
  coverImageUrl: string | null;
}

const empty: Form = { id: null, name: "", description: "", coverImageUrl: null };

export function UniversesPage() {
  const locale = useLocale();
  const { user } = useAuth();
  const t =
    locale === "tr"
      ? {
          title: "Evrenler",
          subtitle: "Hikâye ve karakterleri bir araya getiren dünyalar.",
          mine: "Evrenlerim",
          new: "Yeni evren",
          name: "İsim",
          description: "Açıklama",
          cover: "Kapak görseli",
          upload: "Görsel yükle",
          save: "Kaydet",
          cancel: "Vazgeç",
          edit: "Düzenle",
          del: "Sil",
          confirmDel: "Bu evreni silmek istediğine emin misin? (Hikâye/karakterler silinmez)",
          empty: "Henüz evren yok.",
          required: "İsim gerekli.",
          stories: "hikâye",
          characters: "karakter",
        }
      : {
          title: "Universes",
          subtitle: "Worlds that gather stories and characters together.",
          mine: "My universes",
          new: "New universe",
          name: "Name",
          description: "Description",
          cover: "Cover image",
          upload: "Upload image",
          save: "Save",
          cancel: "Cancel",
          edit: "Edit",
          del: "Delete",
          confirmDel: "Delete this universe? (Its stories/characters are kept)",
          empty: "No universes yet.",
          required: "Name is required.",
          stories: "stories",
          characters: "characters",
        };

  const [all, setAll] = React.useState<UniverseListItem[] | null>(null);
  const [mine, setMine] = React.useState<UniverseListItem[]>([]);
  const [form, setForm] = React.useState<Form | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const reload = React.useCallback(() => {
    listUniverses(locale).then(setAll);
    if (user) listMyUniverses().then(setMine);
    else setMine([]);
  }, [locale, user]);

  React.useEffect(() => {
    reload();
  }, [reload]);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !form) return;
    setUploading(true);
    try {
      setForm({ ...form, coverImageUrl: await uploadImage(file) });
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!form) return;
    if (!form.name.trim()) {
      setError(t.required);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const body = {
        name: form.name.trim(),
        description: form.description.trim(),
        coverImageUrl: form.coverImageUrl,
        language: locale,
      };
      if (form.id) await updateUniverse(form.id, body);
      else await createUniverse(body);
      setForm(null);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kaydedilemedi.");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(u: UniverseListItem) {
    if (!confirm(t.confirmDel)) return;
    await deleteUniverse(u.id);
    reload();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold sm:text-4xl">
            {t.title}
          </h1>
          <p className="text-muted-foreground text-sm">{t.subtitle}</p>
        </div>
        {user && !form && (
          <Button onClick={() => setForm({ ...empty })}>
            <Plus /> {t.new}
          </Button>
        )}
      </div>

      {form && (
        <Card className="mb-10 flex flex-col gap-4 p-5">
          <label className="flex flex-col gap-1.5">
            <Label>{t.name}</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <Label>{t.description}</Label>
            <Textarea
              value={form.description}
              className="min-h-24"
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>
          <div className="flex flex-col gap-1.5">
            <Label>{t.cover}</Label>
            <div className="flex items-center gap-3">
              {form.coverImageUrl && (
                <img
                  src={form.coverImageUrl}
                  alt=""
                  className="h-12 w-20 rounded-md object-cover"
                />
              )}
              <Button asChild variant="outline" size="sm">
                <label className="cursor-pointer">
                  {uploading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Upload />
                  )}
                  {t.upload}
                  <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
                </label>
              </Button>
            </div>
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <div className="flex gap-3">
            <Button onClick={save} disabled={busy}>
              {busy && <Loader2 className="size-4 animate-spin" />}
              {t.save}
            </Button>
            <Button variant="outline" onClick={() => setForm(null)}>
              <X /> {t.cancel}
            </Button>
          </div>
        </Card>
      )}

      {mine.length > 0 && (
        <section className="mb-12">
          <h2 className="font-serif mb-4 text-xl font-semibold">{t.mine}</h2>
          <div className="flex flex-col gap-2">
            {mine.map((u) => (
              <Card key={u.id} className="flex-row items-center gap-4 p-3">
                <Link
                  to={`/${locale}/universe/${u.slug}`}
                  className="min-w-0 flex-1"
                >
                  <div className="truncate font-serif text-lg font-semibold">
                    {u.name}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {u.storyCount} {t.stories} · {u.characterCount}{" "}
                    {t.characters}
                  </div>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  title={t.edit}
                  onClick={() =>
                    setForm({
                      id: u.id,
                      name: u.name,
                      description: u.description,
                      coverImageUrl: u.coverImageUrl,
                    })
                  }
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title={t.del}
                  onClick={() => onDelete(u)}
                >
                  <Trash2 className="text-destructive size-4" />
                </Button>
              </Card>
            ))}
          </div>
        </section>
      )}

      {all === null ? (
        <div className="grid gap-6 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      ) : all.length === 0 ? (
        <p className="text-muted-foreground py-16 text-center">{t.empty}</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {all.map((u) => (
            <Link
              key={u.id}
              to={`/${locale}/universe/${u.slug}`}
              className="group border-border/70 bg-card flex flex-col overflow-hidden rounded-xl border transition-all hover:shadow-lg"
            >
              {u.coverImageUrl ? (
                <div className="aspect-[16/7] overflow-hidden">
                  <img
                    src={u.coverImageUrl}
                    alt=""
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="bg-primary/10 text-primary flex aspect-[16/7] items-center justify-center">
                  <Globe2 className="size-10" />
                </div>
              )}
              <div className="flex flex-1 flex-col gap-2 p-5">
                <h3 className="font-serif text-xl font-semibold">{u.name}</h3>
                {u.description && (
                  <p className="text-muted-foreground line-clamp-2 text-sm">
                    {u.description}
                  </p>
                )}
                <div className="text-muted-foreground mt-auto flex items-center gap-4 pt-2 text-xs">
                  <span className="inline-flex items-center gap-1">
                    <BookOpen className="size-3.5" /> {u.storyCount}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="size-3.5" /> {u.characterCount}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

import * as React from "react";
import { Navigate } from "react-router-dom";
import { Loader2, Pencil, Plus, Trash2, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getCharacter } from "@/lib/content";
import { uploadImage } from "@/lib/author";
import {
  createCharacter,
  deleteCharacter,
  isAdmin,
  listCharacters,
  readSheet,
  updateCharacter,
  type CharacterSheet,
} from "@/lib/characters";
import { useAuth } from "@/lib/auth";
import { useLocale } from "@/lib/hooks";

type Row = Awaited<ReturnType<typeof listCharacters>>[number];

interface FormState {
  id: string | null;
  name: string;
  kind: string;
  imageUrl: string | null;
  explanation: string;
  age: string;
  pronouns: string;
  role: string;
  traits: string;
  appearance: string;
  background: string;
}

const empty: FormState = {
  id: null,
  name: "",
  kind: "",
  imageUrl: null,
  explanation: "",
  age: "",
  pronouns: "",
  role: "",
  traits: "",
  appearance: "",
  background: "",
};

const T = {
  tr: {
    title: "Karakterler",
    subtitle: "Karakter ekle, düzenle ve karakter künyesini doldur.",
    new: "Yeni karakter",
    name: "İsim",
    kind: "Tür / ırk",
    kindPh: "insan, elf, ejderha…",
    image: "Görsel",
    upload: "Görsel yükle",
    explanation: "Kısa özet",
    sheet: "Karakter künyesi (opsiyonel)",
    age: "Yaş",
    pronouns: "Zamir",
    role: "Rol",
    rolePh: "başkahraman, yardımcı, düşman…",
    traits: "Özellikler",
    traitsPh: "cesur, meraklı, sadık (virgülle ayır)",
    appearance: "Görünüş",
    background: "Geçmiş / hikâyesi",
    save: "Kaydet",
    cancel: "Vazgeç",
    edit: "Düzenle",
    del: "Sil",
    confirmDel: "Bu karakteri silmek istediğine emin misin?",
    empty: "Henüz karakter yok.",
    required: "İsim gerekli.",
    editing: "Karakteri düzenle",
    creating: "Yeni karakter",
  },
  en: {
    title: "Characters",
    subtitle: "Add, edit characters and fill their sheet.",
    new: "New character",
    name: "Name",
    kind: "Kind / species",
    kindPh: "human, elf, dragon…",
    image: "Image",
    upload: "Upload image",
    explanation: "Short summary",
    sheet: "Character sheet (optional)",
    age: "Age",
    pronouns: "Pronouns",
    role: "Role",
    rolePh: "protagonist, sidekick, villain…",
    traits: "Traits",
    traitsPh: "brave, curious, loyal (comma-separated)",
    appearance: "Appearance",
    background: "Background / story",
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    del: "Delete",
    confirmDel: "Delete this character?",
    empty: "No characters yet.",
    required: "Name is required.",
    editing: "Edit character",
    creating: "New character",
  },
} as const;

export function AdminCharactersPage() {
  const locale = useLocale();
  const t = T[locale];
  const { user, loading: authLoading } = useAuth();

  const [rows, setRows] = React.useState<Row[] | null>(null);
  const [form, setForm] = React.useState<FormState | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const reload = React.useCallback(() => {
    listCharacters(locale).then(setRows);
  }, [locale]);

  React.useEffect(() => {
    if (user && isAdmin(user.roles)) reload();
  }, [user, reload]);

  if (!authLoading && (!user || !isAdmin(user.roles)))
    return <Navigate to={`/${locale}`} replace />;

  const set = (patch: Partial<FormState>) =>
    setForm((f) => (f ? { ...f, ...patch } : f));

  async function startEdit(row: Row) {
    setError(null);
    const full = await getCharacter(locale, row.slug);
    const sheet: CharacterSheet = readSheet(full?.content);
    setForm({
      id: row.id,
      name: row.name,
      kind: row.kind ?? "",
      imageUrl: row.imageUrl ?? null,
      explanation: row.explanation ?? "",
      age: sheet.age ?? "",
      pronouns: sheet.pronouns ?? "",
      role: sheet.role ?? "",
      traits: (sheet.traits ?? []).join(", "),
      appearance: sheet.appearance ?? "",
      background: sheet.background ?? "",
    });
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      set({ imageUrl: await uploadImage(file) });
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
      const sheet: CharacterSheet = {
        age: form.age.trim() || undefined,
        pronouns: form.pronouns.trim() || undefined,
        role: form.role.trim() || undefined,
        traits: form.traits
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        appearance: form.appearance.trim() || undefined,
        background: form.background.trim() || undefined,
      };
      const body = {
        name: form.name.trim(),
        explanation: form.explanation.trim(),
        kind: form.kind.trim(),
        imageUrl: form.imageUrl,
        content: { version: 1, sheet, blocks: [] },
        language: locale,
      };
      if (form.id) await updateCharacter(form.id, body);
      else await createCharacter(body);
      setForm(null);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kaydedilemedi.");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(row: Row) {
    if (!confirm(t.confirmDel)) return;
    await deleteCharacter(row.id);
    reload();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold sm:text-4xl">
            {t.title}
          </h1>
          <p className="text-muted-foreground text-sm">{t.subtitle}</p>
        </div>
        {!form && (
          <Button onClick={() => setForm({ ...empty })}>
            <Plus /> {t.new}
          </Button>
        )}
      </div>

      {form ? (
        <Card className="flex flex-col gap-5 p-5">
          <h2 className="font-serif text-xl font-semibold">
            {form.id ? t.editing : t.creating}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.name}>
              <Input value={form.name} onChange={(e) => set({ name: e.target.value })} />
            </Field>
            <Field label={t.kind}>
              <Input
                value={form.kind}
                placeholder={t.kindPh}
                onChange={(e) => set({ kind: e.target.value })}
              />
            </Field>
          </div>

          <Field label={t.image}>
            <div className="flex items-center gap-3">
              {form.imageUrl && (
                <img
                  src={form.imageUrl}
                  alt=""
                  className="size-14 rounded-md object-cover"
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
          </Field>

          <Field label={t.explanation}>
            <Textarea
              value={form.explanation}
              onChange={(e) => set({ explanation: e.target.value })}
              className="min-h-16"
            />
          </Field>

          <div>
            <p className="text-muted-foreground mb-3 text-sm font-medium">
              {t.sheet}
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label={t.age}>
                <Input value={form.age} onChange={(e) => set({ age: e.target.value })} />
              </Field>
              <Field label={t.pronouns}>
                <Input
                  value={form.pronouns}
                  onChange={(e) => set({ pronouns: e.target.value })}
                />
              </Field>
              <Field label={t.role}>
                <Input
                  value={form.role}
                  placeholder={t.rolePh}
                  onChange={(e) => set({ role: e.target.value })}
                />
              </Field>
            </div>
            <div className="mt-4 flex flex-col gap-4">
              <Field label={t.traits}>
                <Input
                  value={form.traits}
                  placeholder={t.traitsPh}
                  onChange={(e) => set({ traits: e.target.value })}
                />
              </Field>
              <Field label={t.appearance}>
                <Textarea
                  value={form.appearance}
                  onChange={(e) => set({ appearance: e.target.value })}
                  className="min-h-16"
                />
              </Field>
              <Field label={t.background}>
                <Textarea
                  value={form.background}
                  onChange={(e) => set({ background: e.target.value })}
                  className="min-h-24"
                />
              </Field>
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
      ) : rows === null ? (
        <div className="py-16 text-center">
          <Loader2 className="mx-auto size-6 animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground py-16 text-center">{t.empty}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((c) => (
            <Card key={c.id} className="flex-row items-center gap-4 p-3">
              {c.imageUrl ? (
                <img
                  src={c.imageUrl}
                  alt=""
                  className="size-12 rounded-md object-cover"
                />
              ) : (
                <div className="bg-muted size-12 rounded-md" />
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate font-serif text-lg font-semibold">
                  {c.name}
                </div>
                <div className="text-muted-foreground truncate text-xs">
                  {[c.kind, c.explanation].filter(Boolean).join(" · ")}
                </div>
              </div>
              <Button variant="ghost" size="icon" title={t.edit} onClick={() => startEdit(c)}>
                <Pencil className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" title={t.del} onClick={() => onDelete(c)}>
                <Trash2 className="text-destructive size-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </label>
  );
}

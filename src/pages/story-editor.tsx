import * as React from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FlowEditor } from "@/components/flow-editor";
import { CANVAS_W } from "@/components/canvas-view";
import { getStory } from "@/lib/content";
import {
  createStory,
  publishStory,
  updateStory,
  uploadImage,
} from "@/lib/author";
import { listCharacters, type CharacterListItem } from "@/lib/characters";
import { listUniverses, type UniverseListItem } from "@/lib/universes";
import { CharacterPicker } from "@/components/character-picker";
import { ImagePicker } from "@/components/image-picker";
import { useAuth } from "@/lib/auth";
import { useLocale } from "@/lib/hooks";
import type { StoryBlock, StoryDocument } from "@/lib/types";

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const emptyDoc = (): StoryDocument => ({
  version: 1,
  mode: "flow",
  blocks: [],
});

/**
 * Bring any stored document into the editable flow (hybrid) shape.
 * A legacy whole-document canvas becomes a single design-zone block so the
 * author can keep the layout and add plain prose around it.
 */
function ensureEditableDoc(doc?: StoryDocument | null): StoryDocument {
  if (!doc || !doc.blocks?.length) return emptyDoc();

  if (doc.mode === "canvas") {
    const zoneBlock: StoryBlock = {
      id: uid(),
      type: "canvas",
      data: {
        zone: {
          blocks: doc.blocks,
          height: doc.canvas?.height,
          background: doc.canvas?.background,
        },
      },
    };
    return { version: 1, mode: "flow", blocks: [zoneBlock] };
  }

  // Flow / hybrid: keep as-is, just guarantee every block has an id.
  return {
    ...doc,
    mode: "flow",
    blocks: doc.blocks.map((b) => (b.id ? b : { ...b, id: uid() })),
  };
}

const T = {
  tr: {
    newTitle: "Yeni hikâye",
    editTitle: "Hikâyeyi düzenle",
    title: "Başlık",
    summary: "Özet",
    cover: "Kapak görseli",
    upload: "Görsel yükle",
    content: "İçerik",
    characters: "Karakterler",
    charactersHint: "Bu hikâyede yer alan karakterleri seç.",
    noCharacters: "Henüz karakter yok — admin panelinden ekleyebilirsin.",
    genre: "Tür",
    genrePh: "fantastik, polisiye, aşk…",
    tags: "Etiketler",
    tagsPh: "macera, gizem (virgülle ayır)",
    coauthors: "Ortak yazarlar",
    coauthorsPh: "kullanıcı adları (virgülle ayır)",
    universe: "Evren",
    universeNone: "— Evren yok —",
    saveDraft: "Taslağı kaydet",
    publish: "Yayınla",
  },
  en: {
    newTitle: "New story",
    editTitle: "Edit story",
    title: "Title",
    summary: "Summary",
    cover: "Cover image",
    upload: "Upload image",
    content: "Content",
    characters: "Characters",
    charactersHint: "Pick the characters that appear in this story.",
    noCharacters: "No characters yet — add them from the admin panel.",
    genre: "Genre",
    genrePh: "fantasy, mystery, romance…",
    tags: "Tags",
    tagsPh: "adventure, mystery (comma-separated)",
    coauthors: "Co-authors",
    coauthorsPh: "usernames (comma-separated)",
    saveDraft: "Save draft",
    publish: "Publish",
  },
} as const;

export function StoryEditorPage() {
  const locale = useLocale();
  const t = T[locale];
  const navigate = useNavigate();
  const { slug } = useParams();
  const { user, loading: authLoading } = useAuth();

  const [storyId, setStoryId] = React.useState<string | null>(null);
  const [title, setTitle] = React.useState("");
  const [summary, setSummary] = React.useState("");
  const [cover, setCover] = React.useState<string | null>(null);
  const [doc, setDoc] = React.useState<StoryDocument>(emptyDoc);
  const [genre, setGenre] = React.useState("");
  const [tags, setTags] = React.useState("");
  const [charRefs, setCharRefs] = React.useState<string[]>([]);
  const [coauthors, setCoauthors] = React.useState("");
  const [universeId, setUniverseId] = React.useState("");
  const [allChars, setAllChars] = React.useState<CharacterListItem[]>([]);
  const [universes, setUniverses] = React.useState<UniverseListItem[]>([]);
  const [loading, setLoading] = React.useState(Boolean(slug));
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    listCharacters(locale).then(setAllChars);
    listUniverses(locale).then(setUniverses);
  }, [locale]);

  React.useEffect(() => {
    if (!slug) return;
    let active = true;
    getStory(locale, slug).then((s) => {
      if (!active || !s) return;
      setStoryId(s.id);
      setTitle(s.title);
      setSummary(s.explanation);
      setCover(s.image);
      setCharRefs(s.characters ?? []);
      setCoauthors((s.coauthors ?? []).map((a) => a.userName).join(", "));
      setUniverseId(s.universeId ?? "");
      setGenre(s.genre ?? "");
      setTags((s.tags ?? []).join(", "));
      setDoc(ensureEditableDoc(s.content));
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [locale, slug]);

  if (!authLoading && !user) return <Navigate to={`/${locale}/login`} replace />;

  async function save(publish: boolean) {
    setError(null);
    if (!title.trim()) {
      setError(locale === "tr" ? "Başlık gerekli." : "Title is required.");
      return;
    }
    setSaving(true);
    try {
      const body = {
        title: title.trim(),
        summary: summary.trim(),
        coverImageUrl: cover,
        content: {
          ...doc,
          version: doc.version ?? 1,
          mode: "flow" as const,
        },
        language: locale,
        characterRefs: charRefs,
        coauthors: coauthors
          .split(",")
          .map((s) => s.trim().replace(/^@/, ""))
          .filter(Boolean),
        genre: genre.trim() || null,
        tags: tags
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        universeId: universeId || null,
      };
      const res = storyId
        ? await updateStory(storyId, body)
        : await createStory(body);
      if (publish) await publishStory(res.id);
      navigate(`/${locale}/mine`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-24 text-center sm:px-6">
        <Loader2 className="mx-auto size-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="font-serif mb-6 text-3xl font-semibold">
        {slug ? t.editTitle : t.newTitle}
      </h1>

      <div className="flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <Label>{t.title}</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>

          <div className="flex flex-col gap-1.5">
            <Label>{t.cover}</Label>
            <ImagePicker
              value={cover}
              onChange={setCover}
              locale={locale}
              previewClassName="h-10 w-16"
            />
          </div>
        </div>

        <label className="flex flex-col gap-1.5">
          <Label>{t.summary}</Label>
          <Textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <Label>{t.genre}</Label>
            <Input
              value={genre}
              placeholder={t.genrePh}
              onChange={(e) => setGenre(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <Label>{t.tags}</Label>
            <Input
              value={tags}
              placeholder={t.tagsPh}
              onChange={(e) => setTags(e.target.value)}
            />
          </label>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>{t.characters}</Label>
            {allChars.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t.noCharacters}</p>
            ) : (
              <>
                <p className="text-muted-foreground text-xs">
                  {t.charactersHint}
                </p>
                <CharacterPicker
                  characters={allChars}
                  value={charRefs}
                  onChange={setCharRefs}
                  locale={locale}
                />
              </>
            )}
          </div>

          <label className="flex flex-col gap-1.5">
            <Label>{t.coauthors}</Label>
            <Input
              value={coauthors}
              placeholder={t.coauthorsPh}
              onChange={(e) => setCoauthors(e.target.value)}
            />
          </label>
        </div>

        {universes.length > 0 && (
          <label className="flex flex-col gap-1.5 sm:max-w-xs">
            <Label>{t.universe}</Label>
            <select
              className="border-input bg-background h-9 rounded-md border px-2 text-sm"
              value={universeId}
              onChange={(e) => setUniverseId(e.target.value)}
            >
              <option value="">{t.universeNone}</option>
              {universes.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="flex flex-col gap-2">
          <Label>{t.content}</Label>
          <FlowEditor
            value={doc}
            onChange={setDoc}
            onUploadImage={uploadImage}
            locale={locale}
          />
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => save(false)}
            disabled={saving}
          >
            {saving && <Loader2 className="size-4 animate-spin" />}
            {t.saveDraft}
          </Button>
          <Button onClick={() => save(true)} disabled={saving}>
            {t.publish}
          </Button>
        </div>
      </div>
    </div>
  );
}

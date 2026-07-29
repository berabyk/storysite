import * as React from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import {
  ArrowDown,
  ArrowUp,
  Heading,
  Image as ImageIcon,
  Loader2,
  Trash2,
  Type,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getStory } from "@/lib/content";
import {
  createStory,
  publishStory,
  updateStory,
  uploadImage,
} from "@/lib/author";
import { useAuth } from "@/lib/auth";
import { useLocale } from "@/lib/hooks";
import type { StoryBlock } from "@/lib/types";

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const T = {
  tr: {
    newTitle: "Yeni hikâye",
    editTitle: "Hikâyeyi düzenle",
    title: "Başlık",
    summary: "Özet",
    cover: "Kapak görseli",
    upload: "Görsel yükle",
    addText: "Metin",
    addHeading: "Başlık",
    addImage: "Görsel",
    blocks: "İçerik blokları",
    saveDraft: "Taslağı kaydet",
    publish: "Yayınla",
    empty: "Aşağıdan blok ekleyerek hikâyeni oluşturmaya başla.",
    textPh: "Paragrafını yaz… (boş satır = yeni paragraf)",
    headingPh: "Ara başlık",
    imgUrlPh: "Görsel URL veya yükle",
    saving: "Kaydediliyor…",
  },
  en: {
    newTitle: "New story",
    editTitle: "Edit story",
    title: "Title",
    summary: "Summary",
    cover: "Cover image",
    upload: "Upload image",
    addText: "Text",
    addHeading: "Heading",
    addImage: "Image",
    blocks: "Content blocks",
    saveDraft: "Save draft",
    publish: "Publish",
    empty: "Start building your story by adding blocks below.",
    textPh: "Write your paragraph… (blank line = new paragraph)",
    headingPh: "Subheading",
    imgUrlPh: "Image URL or upload",
    saving: "Saving…",
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
  const [blocks, setBlocks] = React.useState<StoryBlock[]>([]);
  const [loading, setLoading] = React.useState(Boolean(slug));
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Load existing story when editing.
  React.useEffect(() => {
    if (!slug) return;
    let active = true;
    getStory(locale, slug).then((s) => {
      if (!active || !s) return;
      setStoryId(s.id);
      setTitle(s.title);
      setSummary(s.explanation);
      setCover(s.image);
      setBlocks(s.content?.blocks?.length ? s.content.blocks : []);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [locale, slug]);

  if (!authLoading && !user) return <Navigate to={`/${locale}/login`} replace />;

  const addBlock = (type: StoryBlock["type"]) =>
    setBlocks((b) => [...b, { id: uid(), type, data: {} }]);

  const patch = (id: string, data: Partial<StoryBlock["data"]>) =>
    setBlocks((b) =>
      b.map((x) => (x.id === id ? { ...x, data: { ...x.data, ...data } } : x)),
    );

  const remove = (id: string) =>
    setBlocks((b) => b.filter((x) => x.id !== id));

  const move = (id: string, dir: -1 | 1) =>
    setBlocks((b) => {
      const i = b.findIndex((x) => x.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= b.length) return b;
      const copy = [...b];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  async function onCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setCover(await uploadImage(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Yükleme başarısız.");
    }
  }

  async function onBlockImageUpload(id: string, file: File) {
    try {
      patch(id, { url: await uploadImage(file) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Yükleme başarısız.");
    }
  }

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
        content: { version: 1, canvas: { width: 800 }, blocks },
        language: locale,
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
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <Loader2 className="mx-auto size-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-serif mb-6 text-3xl font-semibold">
        {slug ? t.editTitle : t.newTitle}
      </h1>

      <div className="flex flex-col gap-5">
        <label className="flex flex-col gap-1.5">
          <Label>{t.title}</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>

        <label className="flex flex-col gap-1.5">
          <Label>{t.summary}</Label>
          <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} />
        </label>

        {/* Cover */}
        <div className="flex flex-col gap-1.5">
          <Label>{t.cover}</Label>
          <div className="flex items-center gap-3">
            {cover && (
              <img
                src={cover}
                alt=""
                className="h-16 w-24 rounded-md object-cover"
              />
            )}
            <Button asChild variant="outline" size="sm">
              <label className="cursor-pointer">
                <Upload /> {t.upload}
                <input type="file" accept="image/*" className="hidden" onChange={onCoverUpload} />
              </label>
            </Button>
          </div>
        </div>

        {/* Blocks */}
        <div className="flex flex-col gap-3">
          <Label>{t.blocks}</Label>
          {blocks.length === 0 && (
            <p className="text-muted-foreground text-sm">{t.empty}</p>
          )}
          {blocks.map((b, i) => (
            <Card key={b.id} className="gap-2 p-3">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  {b.type === "heading" ? (
                    <Input
                      value={b.data?.text ?? ""}
                      placeholder={t.headingPh}
                      onChange={(e) => patch(b.id, { text: e.target.value })}
                    />
                  ) : b.type === "image" ? (
                    <div className="flex flex-col gap-2">
                      {b.data?.url && (
                        <img src={b.data.url} alt="" className="max-h-48 rounded-md object-contain" />
                      )}
                      <div className="flex gap-2">
                        <Input
                          value={b.data?.url ?? ""}
                          placeholder={t.imgUrlPh}
                          onChange={(e) => patch(b.id, { url: e.target.value })}
                        />
                        <Button asChild variant="outline" size="sm">
                          <label className="cursor-pointer">
                            <Upload />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) =>
                                e.target.files?.[0] &&
                                onBlockImageUpload(b.id, e.target.files[0])
                              }
                            />
                          </label>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Textarea
                      value={b.data?.text ?? ""}
                      placeholder={t.textPh}
                      className="min-h-28"
                      onChange={(e) => patch(b.id, { text: e.target.value })}
                    />
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <Button variant="ghost" size="icon" onClick={() => move(b.id, -1)} disabled={i === 0}>
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => move(b.id, 1)} disabled={i === blocks.length - 1}>
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(b.id)}>
                    <Trash2 className="text-destructive size-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => addBlock("text")}>
              <Type /> {t.addText}
            </Button>
            <Button variant="outline" size="sm" onClick={() => addBlock("heading")}>
              <Heading /> {t.addHeading}
            </Button>
            <Button variant="outline" size="sm" onClick={() => addBlock("image")}>
              <ImageIcon /> {t.addImage}
            </Button>
          </div>
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={() => save(false)} disabled={saving}>
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

import * as React from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Loader2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CanvasEditor } from "@/components/canvas-editor";
import { CANVAS_W } from "@/components/canvas-view";
import { getStory } from "@/lib/content";
import {
  createStory,
  publishStory,
  updateStory,
  uploadImage,
} from "@/lib/author";
import { useAuth } from "@/lib/auth";
import { useLocale } from "@/lib/hooks";
import type { StoryBlock, StoryDocument } from "@/lib/types";

const emptyDoc = (): StoryDocument => ({
  version: 1,
  mode: "canvas",
  canvas: { width: CANVAS_W },
  blocks: [],
});

function estimateHeight(b: StoryBlock): number {
  if (b.type === "image") return 320;
  if (b.type === "heading") return 72;
  if (b.type === "divider" || b.type === "box") return 48;
  const text =
    (b.data?.text as string) ??
    ((b.data?.html as string) ?? "").replace(/<[^>]+>/g, " ");
  return Math.min(2400, Math.max(96, Math.ceil(text.length / 58) * 30 + 48));
}

/** Ensure any loaded document is in editable free-form canvas mode. */
function ensureCanvasDoc(doc?: StoryDocument | null): StoryDocument {
  if (!doc || !doc.blocks?.length) return emptyDoc();
  const positioned = doc.blocks.some(
    (b) => typeof b.x === "number" && typeof b.w === "number",
  );
  if (doc.mode === "canvas" || positioned) {
    return { ...doc, mode: "canvas", canvas: { width: CANVAS_W, ...doc.canvas } };
  }
  // Migrate a legacy flow document into a stacked canvas layout.
  let y = 48;
  const blocks = doc.blocks.map((b, i) => {
    const h = estimateHeight(b);
    const block: StoryBlock = { ...b, x: 60, y, w: CANVAS_W - 120, h, z: i + 1 };
    y += h + 24;
    return block;
  });
  return { version: 1, mode: "canvas", canvas: { width: CANVAS_W }, blocks };
}

const T = {
  tr: {
    newTitle: "Yeni hikâye",
    editTitle: "Hikâyeyi düzenle",
    title: "Başlık",
    summary: "Özet",
    cover: "Kapak görseli",
    upload: "Görsel yükle",
    design: "Tasarım",
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
    design: "Design",
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
  const [loading, setLoading] = React.useState(Boolean(slug));
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!slug) return;
    let active = true;
    getStory(locale, slug).then((s) => {
      if (!active || !s) return;
      setStoryId(s.id);
      setTitle(s.title);
      setSummary(s.explanation);
      setCover(s.image);
      setDoc(ensureCanvasDoc(s.content));
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [locale, slug]);

  if (!authLoading && !user) return <Navigate to={`/${locale}/login`} replace />;

  async function onCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setCover(await uploadImage(file));
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
        content: {
          ...doc,
          version: doc.version ?? 1,
          mode: "canvas" as const,
          canvas: { width: CANVAS_W, ...doc.canvas },
        },
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
            <div className="flex items-center gap-3">
              {cover && (
                <img
                  src={cover}
                  alt=""
                  className="h-10 w-16 rounded-md object-cover"
                />
              )}
              <Button asChild variant="outline" size="sm">
                <label className="cursor-pointer">
                  <Upload /> {t.upload}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onCoverUpload}
                  />
                </label>
              </Button>
            </div>
          </div>
        </div>

        <label className="flex flex-col gap-1.5">
          <Label>{t.summary}</Label>
          <Textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
        </label>

        <div className="flex flex-col gap-2">
          <Label>{t.design}</Label>
          <CanvasEditor
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

import * as React from "react";
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  deleteMedia,
  listMyMedia,
  uploadMedia,
  type MediaItem,
} from "@/lib/media";
import { useAuth } from "@/lib/auth";
import { useLocale } from "@/lib/hooks";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function MediaLibraryPage() {
  const locale = useLocale();
  const { user } = useAuth();
  const tr = locale === "tr";

  const [items, setItems] = React.useState<MediaItem[] | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    listMyMedia().then(setItems);
  }, []);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of files) {
        const media = await uploadMedia(file);
        setItems((prev) => [media, ...(prev ?? [])]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Yüklenemedi.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function onDelete(item: MediaItem) {
    if (!confirm(tr ? "Bu görseli silmek istiyor musun?" : "Delete this image?"))
      return;
    await deleteMedia(item.id);
    setItems((prev) => prev?.filter((m) => m.id !== item.id) ?? null);
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center sm:px-6">
        <p className="text-muted-foreground">
          {tr ? "Görsellerini görmek için giriş yap." : "Sign in to see your images."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold sm:text-4xl">
            {tr ? "Görsellerim" : "My images"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {tr
              ? "Yüklediğin görseller. Her yerde tekrar kullanabilir ya da silebilirsin."
              : "Images you uploaded. Reuse them anywhere or delete them."}
          </p>
        </div>
        <Button asChild disabled={uploading}>
          <label className="cursor-pointer">
            {uploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload />
            )}
            {tr ? "Görsel yükle" : "Upload image"}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={onUpload}
            />
          </label>
        </Button>
      </div>

      {error && <p className="text-destructive mb-4 text-sm">{error}</p>}

      {items === null ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-3 py-24 text-center">
          <ImagePlus className="size-10 opacity-60" />
          <p>{tr ? "Henüz görsel yüklemedin." : "You haven't uploaded any images yet."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="group border-border/60 bg-card relative overflow-hidden rounded-xl border"
            >
              <div className="aspect-square overflow-hidden">
                <img src={item.url} alt="" className="size-full object-cover" />
              </div>
              <div className="flex items-center justify-between gap-2 p-2">
                <span className="text-muted-foreground text-xs">
                  {formatSize(item.sizeBytes)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  title={tr ? "Sil" : "Delete"}
                  onClick={() => onDelete(item)}
                >
                  <Trash2 className="text-destructive size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

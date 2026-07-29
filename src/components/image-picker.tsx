import * as React from "react";
import { ImagePlus, Loader2, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  deleteMedia,
  listMyMedia,
  uploadMedia,
  type MediaItem,
} from "@/lib/media";
import type { Locale } from "@/lib/types";

interface Props {
  value: string | null;
  onChange: (url: string | null) => void;
  locale: Locale;
  /** Tailwind classes for the small preview thumbnail. */
  previewClassName?: string;
}

/**
 * Pick an image either from the user's previously uploaded media or by
 * uploading a new one. Selecting a library image never re-uploads it.
 */
export function ImagePicker({
  value,
  onChange,
  locale,
  previewClassName = "h-12 w-20",
}: Props) {
  const tr = locale === "tr";
  const [open, setOpen] = React.useState(false);

  return (
    <div className="flex items-center gap-3">
      {value ? (
        <img
          src={value}
          alt=""
          className={cn("rounded-md object-cover", previewClassName)}
        />
      ) : (
        <div
          className={cn(
            "bg-muted text-muted-foreground flex items-center justify-center rounded-md",
            previewClassName,
          )}
        >
          <ImagePlus className="size-5" />
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <ImagePlus /> {tr ? "Görsel seç" : "Choose image"}
      </Button>

      {value && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange(null)}
        >
          <X /> {tr ? "Kaldır" : "Remove"}
        </Button>
      )}

      <PickerDialog
        open={open}
        onOpenChange={setOpen}
        locale={locale}
        onPick={(url) => {
          onChange(url);
          setOpen(false);
        }}
      />
    </div>
  );
}

function PickerDialog({
  open,
  onOpenChange,
  locale,
  onPick,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  locale: Locale;
  onPick: (url: string) => void;
}) {
  const tr = locale === "tr";
  const [items, setItems] = React.useState<MediaItem[] | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    listMyMedia().then(setItems);
  }, []);

  React.useEffect(() => {
    if (open) {
      setError(null);
      load();
    }
  }, [open, load]);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const media = await uploadMedia(file);
      onPick(media.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Yüklenemedi.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function onDelete(item: MediaItem, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(tr ? "Bu görseli silmek istiyor musun?" : "Delete this image?"))
      return;
    await deleteMedia(item.id);
    setItems((prev) => prev?.filter((m) => m.id !== item.id) ?? null);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{tr ? "Görsel seç" : "Choose image"}</DialogTitle>
        </DialogHeader>

        <div className="mb-3 flex items-center gap-3">
          <Button asChild variant="default" size="sm" disabled={uploading}>
            <label className="cursor-pointer">
              {uploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload />
              )}
              {tr ? "Yeni yükle" : "Upload new"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onUpload}
              />
            </label>
          </Button>
          <span className="text-muted-foreground text-xs">
            {tr
              ? "veya aşağıdan daha önce yüklediklerinden seç"
              : "or pick one you uploaded before"}
          </span>
        </div>

        {error && (
          <p className="text-destructive mb-3 text-sm">{error}</p>
        )}

        <ScrollArea className="max-h-[55vh]">
          {items === null ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              {tr ? "Yükleniyor…" : "Loading…"}
            </p>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              {tr
                ? "Henüz görsel yüklemedin."
                : "You haven't uploaded any images yet."}
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-3 pr-3 sm:grid-cols-4">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onPick(item.url)}
                  className="group border-border/60 relative aspect-square overflow-hidden rounded-lg border"
                >
                  <img
                    src={item.url}
                    alt=""
                    className="size-full object-cover transition-transform group-hover:scale-105"
                  />
                  <span
                    role="button"
                    tabIndex={-1}
                    onClick={(e) => onDelete(item, e)}
                    className="bg-background/80 text-destructive absolute top-1 right-1 hidden rounded-md p-1 group-hover:block"
                    title={tr ? "Sil" : "Delete"}
                  >
                    <X className="size-3.5" />
                  </span>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

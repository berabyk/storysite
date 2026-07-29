import * as React from "react";
import {
  ChevronDown,
  ChevronUp,
  Heading as HeadingIcon,
  Image as ImageIcon,
  LayoutTemplate,
  Loader2,
  Minus,
  Pilcrow,
  Trash2,
  Upload,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CanvasEditor } from "@/components/canvas-editor";
import { CANVAS_W } from "@/components/canvas-view";
import type { Locale, StoryBlock, StoryDocument } from "@/lib/types";

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const L = {
  tr: {
    paragraph: "Paragraf",
    heading: "Başlık",
    image: "Görsel",
    divider: "Ayraç",
    zone: "Tasarım alanı",
    add: "Blok ekle",
    empty: "Düz yazı ekle ya da araya bir tasarım alanı koy — karışık kullanabilirsin.",
    paragraphPlaceholder: "Yazmaya başla… (boş satır bırakarak paragraf ayır)",
    headingPlaceholder: "Bölüm başlığı",
    upload: "Görsel yükle",
    replace: "Değiştir",
    alt: "Görsel açıklaması (alt)",
    up: "Yukarı",
    down: "Aşağı",
    remove: "Kaldır",
    zoneHint: "Serbest tasarım alanı — blokları sürükleyip yerleştir.",
    imported: "İçe aktarılmış içerik",
    h2: "Büyük",
    h3: "Küçük",
  },
  en: {
    paragraph: "Paragraph",
    heading: "Heading",
    image: "Image",
    divider: "Divider",
    zone: "Design zone",
    add: "Add block",
    empty: "Add plain prose or drop a design zone in between — mix them freely.",
    paragraphPlaceholder: "Start writing… (leave a blank line between paragraphs)",
    headingPlaceholder: "Section heading",
    upload: "Upload image",
    replace: "Replace",
    alt: "Image description (alt)",
    up: "Up",
    down: "Down",
    remove: "Remove",
    zoneHint: "Free design zone — drag blocks into place.",
    imported: "Imported content",
    h2: "Large",
    h3: "Small",
  },
} as const;

function newBlock(type: string): StoryBlock {
  switch (type) {
    case "heading":
      return { id: uid(), type, data: { text: "", level: 2 } };
    case "image":
      return { id: uid(), type, data: { url: "", alt: "" } };
    case "divider":
      return { id: uid(), type, data: {} };
    case "canvas":
      return { id: uid(), type, data: { zone: { blocks: [], height: 420 } } };
    case "text":
    default:
      return { id: uid(), type: "text", data: { text: "" } };
  }
}

export interface FlowEditorProps {
  value: StoryDocument;
  onChange: (doc: StoryDocument) => void;
  onUploadImage: (file: File) => Promise<string>;
  locale: Locale;
}

export function FlowEditor({
  value,
  onChange,
  onUploadImage,
  locale,
}: FlowEditorProps) {
  const t = L[locale] ?? L.tr;
  const blocks = value.blocks;

  const setBlocks = (next: StoryBlock[]) =>
    onChange({ ...value, mode: "flow", blocks: next });

  const add = (type: string) => setBlocks([...blocks, newBlock(type)]);

  const patch = (id: string, data: Partial<StoryBlock["data"]>) =>
    setBlocks(
      blocks.map((b) => (b.id === id ? { ...b, data: { ...b.data, ...data } } : b)),
    );

  const remove = (id: string) => setBlocks(blocks.filter((b) => b.id !== id));

  const move = (id: string, dir: -1 | 1) => {
    const i = blocks.findIndex((b) => b.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    setBlocks(next);
  };

  return (
    <div className="flex flex-col gap-3">
      {blocks.length === 0 && (
        <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
          {t.empty}
        </p>
      )}

      {blocks.map((b, i) => (
        <Section
          key={b.id}
          block={b}
          first={i === 0}
          last={i === blocks.length - 1}
          t={t}
          locale={locale}
          onUploadImage={onUploadImage}
          onPatch={(d) => patch(b.id, d)}
          onZone={(zone) => patch(b.id, { zone })}
          onMove={(dir) => move(b.id, dir)}
          onRemove={() => remove(b.id)}
        />
      ))}

      {/* Insert toolbar */}
      <div className="bg-card/70 flex flex-wrap items-center gap-1.5 rounded-lg border p-2">
        <span className="text-muted-foreground mr-1 pl-1 text-sm">{t.add}:</span>
        <AddButton icon={<Pilcrow className="size-4" />} label={t.paragraph} onClick={() => add("text")} />
        <AddButton icon={<HeadingIcon className="size-4" />} label={t.heading} onClick={() => add("heading")} />
        <AddButton icon={<ImageIcon className="size-4" />} label={t.image} onClick={() => add("image")} />
        <AddButton icon={<Minus className="size-4" />} label={t.divider} onClick={() => add("divider")} />
        <span className="bg-border mx-1 h-6 w-px" />
        <AddButton
          icon={<LayoutTemplate className="size-4" />}
          label={t.zone}
          onClick={() => add("canvas")}
          accent
        />
      </div>
    </div>
  );
}

interface SectionProps {
  block: StoryBlock;
  first: boolean;
  last: boolean;
  t: (typeof L)["tr"];
  locale: Locale;
  onUploadImage: (file: File) => Promise<string>;
  onPatch: (data: Partial<StoryBlock["data"]>) => void;
  onZone: (zone: NonNullable<StoryBlock["data"]>["zone"]) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}

function Section({
  block: b,
  first,
  last,
  t,
  locale,
  onUploadImage,
  onPatch,
  onZone,
  onMove,
  onRemove,
}: SectionProps) {
  const [uploading, setUploading] = React.useState(false);

  async function upload(file: File) {
    setUploading(true);
    try {
      onPatch({ url: await onUploadImage(file) });
    } finally {
      setUploading(false);
    }
  }

  const zoneValue: StoryDocument = {
    version: 1,
    mode: "canvas",
    canvas: {
      width: CANVAS_W,
      height: b.data?.zone?.height,
      background: b.data?.zone?.background,
    },
    blocks: b.data?.zone?.blocks ?? [],
  };

  return (
    <div className="group bg-card/40 relative rounded-lg border p-3 pr-11">
      {/* side controls */}
      <div className="absolute right-1.5 top-1.5 flex flex-col gap-0.5">
        <IconBtn title={t.up} disabled={first} onClick={() => onMove(-1)}>
          <ChevronUp className="size-4" />
        </IconBtn>
        <IconBtn title={t.down} disabled={last} onClick={() => onMove(1)}>
          <ChevronDown className="size-4" />
        </IconBtn>
        <IconBtn title={t.remove} onClick={onRemove}>
          <Trash2 className="text-destructive size-4" />
        </IconBtn>
      </div>

      {b.type === "text" && (
        <Textarea
          value={(b.data?.text as string) ?? ""}
          placeholder={t.paragraphPlaceholder}
          onChange={(e) => onPatch({ text: e.target.value })}
          className="font-serif min-h-28 border-0 bg-transparent p-1 text-[17px] leading-relaxed shadow-none focus-visible:ring-0"
        />
      )}

      {b.type === "heading" && (
        <div className="flex flex-col gap-2">
          <Input
            value={(b.data?.text as string) ?? ""}
            placeholder={t.headingPlaceholder}
            onChange={(e) => onPatch({ text: e.target.value })}
            className="font-serif h-auto border-0 bg-transparent px-1 py-1 font-semibold shadow-none focus-visible:ring-0"
            style={{ fontSize: (b.data?.level ?? 2) === 2 ? 26 : 20 }}
          />
          <div className="flex gap-1">
            {([2, 3] as const).map((lv) => (
              <button
                key={lv}
                type="button"
                onClick={() => onPatch({ level: lv })}
                className={cn(
                  "rounded-md px-2 py-1 text-xs transition-colors",
                  (b.data?.level ?? 2) === lv
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent",
                )}
              >
                {lv === 2 ? t.h2 : t.h3}
              </button>
            ))}
          </div>
        </div>
      )}

      {b.type === "image" && (
        <div className="flex flex-col gap-2">
          {b.data?.url ? (
            <img
              src={b.data.url as string}
              alt={(b.data?.alt as string) ?? ""}
              className="max-h-72 w-full rounded-md object-cover"
            />
          ) : (
            <label className="text-muted-foreground hover:border-ring flex h-32 cursor-pointer items-center justify-center rounded-md border border-dashed text-sm">
              {uploading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <Upload className="size-4" /> {t.upload}
                </span>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
              />
            </label>
          )}
          {b.data?.url && (
            <div className="flex items-center gap-2">
              <label className="hover:bg-accent flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1 text-xs">
                {uploading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Upload className="size-3.5" />
                )}
                {t.replace}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
                />
              </label>
              <Input
                value={(b.data?.alt as string) ?? ""}
                placeholder={t.alt}
                onChange={(e) => onPatch({ alt: e.target.value })}
                className="h-8 flex-1 text-xs"
              />
            </div>
          )}
        </div>
      )}

      {b.type === "divider" && (
        <div className="py-3">
          <hr className="border-border" />
        </div>
      )}

      {b.type === "canvas" && (
        <div className="flex flex-col gap-2">
          <span className="text-muted-foreground text-xs">{t.zoneHint}</span>
          <CanvasEditor
            value={zoneValue}
            onChange={(doc) =>
              onZone({
                blocks: doc.blocks,
                height: doc.canvas?.height,
                background: doc.canvas?.background,
              })
            }
            onUploadImage={onUploadImage}
            locale={locale}
          />
        </div>
      )}

      {b.type === "html" && (
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs">{t.imported}</span>
          <div
            className="prose max-h-64 overflow-auto text-sm"
            style={{ maxWidth: "none" }}
            dangerouslySetInnerHTML={{ __html: (b.data?.html as string) ?? "" }}
          />
        </div>
      )}
    </div>
  );
}

function AddButton({
  icon,
  label,
  onClick,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
        accent
          ? "bg-primary/10 text-primary hover:bg-primary/20"
          : "hover:bg-accent",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function IconBtn({
  children,
  onClick,
  title,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="hover:bg-accent flex size-7 items-center justify-center rounded-md transition-colors disabled:opacity-30"
    >
      {children}
    </button>
  );
}

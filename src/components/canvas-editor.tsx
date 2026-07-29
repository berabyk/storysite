import * as React from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  Bold,
  Copy,
  Heading as HeadingIcon,
  Image as ImageIcon,
  Italic,
  Loader2,
  Square,
  Trash2,
  Type,
  Upload,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { Locale, StoryBlock, StoryDocument } from "@/lib/types";
import {
  BlockView,
  CANVAS_W,
  FONT_OPTIONS,
  textBlockStyle,
} from "@/components/canvas-view";

const MIN_H = 560;
const GRID = 4;
const MINW = 40;
const MINH = 28;

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(Math.max(v, lo), hi);
const snap = (v: number) => Math.round(v / GRID) * GRID;

type Geom = { x: number; y: number; w: number; h: number };

type Gesture =
  | { kind: "move"; id: string; sx: number; sy: number; orig: Geom }
  | {
      kind: "resize";
      id: string;
      handle: string;
      sx: number;
      sy: number;
      orig: Geom;
    };

const HANDLES: { pos: string; style: React.CSSProperties; cursor: string }[] = [
  { pos: "nw", style: { left: -5, top: -5 }, cursor: "nwse-resize" },
  { pos: "n", style: { left: "50%", top: -5, marginLeft: -5 }, cursor: "ns-resize" },
  { pos: "ne", style: { right: -5, top: -5 }, cursor: "nesw-resize" },
  { pos: "e", style: { right: -5, top: "50%", marginTop: -5 }, cursor: "ew-resize" },
  { pos: "se", style: { right: -5, bottom: -5 }, cursor: "nwse-resize" },
  { pos: "s", style: { left: "50%", bottom: -5, marginLeft: -5 }, cursor: "ns-resize" },
  { pos: "sw", style: { left: -5, bottom: -5 }, cursor: "nesw-resize" },
  { pos: "w", style: { left: -5, top: "50%", marginTop: -5 }, cursor: "ew-resize" },
];

const L = {
  tr: {
    text: "Metin",
    heading: "Başlık",
    image: "Görsel",
    box: "Kutu",
    addSpace: "Alan ekle",
    bg: "Zemin",
    clearBg: "Zemini temizle",
    replace: "Değiştir",
    fit: "Sığdır",
    duplicate: "Kopyala",
    forward: "Öne al",
    backward: "Arkaya al",
    delete: "Sil",
    hint: "Bloğu seçmek için tıkla, taşımak için sürükle, yazmak için çift tıkla.",
    empty: "Bir blok ekleyerek tuvale başla.",
    typeHere: "Yazmaya başla…",
  },
  en: {
    text: "Text",
    heading: "Heading",
    image: "Image",
    box: "Box",
    addSpace: "Add space",
    bg: "Background",
    clearBg: "Clear background",
    replace: "Replace",
    fit: "Fit",
    duplicate: "Duplicate",
    forward: "Forward",
    backward: "Backward",
    delete: "Delete",
    hint: "Click to select, drag to move, double-click to type.",
    empty: "Add a block to start your canvas.",
    typeHere: "Start typing…",
  },
} as const;

function blockDefaults(type: string, y: number): StoryBlock {
  const base = { id: uid(), x: 60, y, z: 1 };
  switch (type) {
    case "heading":
      return { ...base, type, w: 680, h: 64, data: { text: "Başlık", fontSize: 36, bold: true } };
    case "image":
      return { ...base, type, w: 360, h: 240, data: { fit: "cover", radius: 12 } };
    case "box":
      return { ...base, type, w: 300, h: 160, data: { bg: "#e9dcc9", radius: 16 } };
    case "text":
    default:
      return { ...base, type: "text", w: 520, h: 96, data: { text: "", fontSize: 19 } };
  }
}

function nextZ(blocks: StoryBlock[]): number {
  return blocks.reduce((m, b) => Math.max(m, b.z ?? 0), 0) + 1;
}

function contentBottom(blocks: StoryBlock[]): number {
  return blocks.reduce((m, b) => Math.max(m, (b.y ?? 0) + (b.h ?? 0)), 0);
}

export interface CanvasEditorProps {
  value: StoryDocument;
  onChange: (doc: StoryDocument) => void;
  onUploadImage: (file: File) => Promise<string>;
  locale: Locale;
}

export function CanvasEditor({
  value,
  onChange,
  onUploadImage,
  locale,
}: CanvasEditorProps) {
  const t = L[locale] ?? L.tr;
  const blocks = value.blocks;
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);

  const wrapRef = React.useRef<HTMLDivElement>(null);
  const scaleRef = React.useRef(1);
  const [scale, setScale] = React.useState(1);
  const gestureRef = React.useRef<Gesture | null>(null);

  const height = Math.max(
    value.canvas?.height ?? MIN_H,
    contentBottom(blocks) + 80,
    MIN_H,
  );

  const selected = blocks.find((b) => b.id === selectedId) ?? null;

  // Keep the surface scaled to the available width.
  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => {
      const s = Math.min(1, el.clientWidth / CANVAS_W);
      scaleRef.current = s;
      setScale(s);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const commit = React.useCallback(
    (
      nextBlocks: StoryBlock[],
      extraCanvas?: Partial<NonNullable<StoryDocument["canvas"]>>,
    ) => {
      // canvas.height only stores an explicit author-added height; the render
      // height auto-grows to fit content (see `height` above / docHeight).
      onChange({
        ...value,
        version: value.version ?? 1,
        mode: "canvas",
        canvas: { width: CANVAS_W, ...value.canvas, ...extraCanvas },
        blocks: nextBlocks,
      });
    },
    [onChange, value],
  );

  const setBlocks = (updater: (b: StoryBlock[]) => StoryBlock[]) =>
    commit(updater(blocks));

  const addBlock = (type: string) => {
    const y = snap(Math.min(contentBottom(blocks) + 24, height - 120));
    const block = { ...blockDefaults(type, Math.max(40, y)), z: nextZ(blocks) };
    commit([...blocks, block]);
    setSelectedId(block.id);
    if (type === "text" || type === "heading") setEditingId(block.id);
  };

  const patchData = (id: string, data: Partial<StoryBlock["data"]>) =>
    setBlocks((bs) =>
      bs.map((b) => (b.id === id ? { ...b, data: { ...b.data, ...data } } : b)),
    );

  const setGeometry = (id: string, g: Geom) =>
    setBlocks((bs) =>
      bs.map((b) => (b.id === id ? { ...b, ...g } : b)),
    );

  const removeBlock = (id: string) => {
    setBlocks((bs) => bs.filter((b) => b.id !== id));
    setSelectedId(null);
    setEditingId(null);
  };

  const duplicate = (id: string) => {
    const b = blocks.find((x) => x.id === id);
    if (!b) return;
    const copy: StoryBlock = {
      ...b,
      id: uid(),
      x: snap((b.x ?? 0) + 24),
      y: snap((b.y ?? 0) + 24),
      z: nextZ(blocks),
      data: { ...b.data },
    };
    commit([...blocks, copy]);
    setSelectedId(copy.id);
  };

  const restack = (id: string, dir: -1 | 1) => {
    const ordered = [...blocks].sort((a, b) => (a.z ?? 0) - (b.z ?? 0));
    const i = ordered.findIndex((b) => b.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= ordered.length) return;
    [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
    commit(ordered.map((b, idx) => ({ ...b, z: idx + 1 })));
  };

  // ---- pointer gesture (move + resize) ----
  const onPointerMove = React.useCallback(
    (e: PointerEvent) => {
      const g = gestureRef.current;
      if (!g) return;
      const s = scaleRef.current || 1;
      const dx = (e.clientX - g.sx) / s;
      const dy = (e.clientY - g.sy) / s;
      const o = g.orig;
      let geom: Geom;
      if (g.kind === "move") {
        geom = {
          x: clamp(snap(o.x + dx), 0, CANVAS_W - o.w),
          y: Math.max(0, snap(o.y + dy)),
          w: o.w,
          h: o.h,
        };
      } else {
        let { x, y, w, h } = o;
        if (g.handle.includes("e")) w = o.w + dx;
        if (g.handle.includes("s")) h = o.h + dy;
        if (g.handle.includes("w")) {
          w = o.w - dx;
          x = o.x + dx;
        }
        if (g.handle.includes("n")) {
          h = o.h - dy;
          y = o.y + dy;
        }
        if (w < MINW) {
          if (g.handle.includes("w")) x = o.x + o.w - MINW;
          w = MINW;
        }
        if (h < MINH) {
          if (g.handle.includes("n")) y = o.y + o.h - MINH;
          h = MINH;
        }
        x = Math.max(0, x);
        y = Math.max(0, y);
        if (x + w > CANVAS_W) w = CANVAS_W - x;
        geom = { x: snap(x), y: snap(y), w: snap(w), h: snap(h) };
      }
      setGeometry(g.id, geom);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [blocks],
  );

  const endGesture = React.useCallback(() => {
    gestureRef.current = null;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", endGesture);
    document.body.style.userSelect = "";
  }, [onPointerMove]);

  const startGesture = (g: Gesture) => {
    gestureRef.current = g;
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", endGesture);
  };

  const onBodyPointerDown = (e: React.PointerEvent, b: StoryBlock) => {
    if (editingId === b.id) return; // let the textarea handle it
    e.preventDefault();
    setSelectedId(b.id);
    startGesture({
      kind: "move",
      id: b.id,
      sx: e.clientX,
      sy: e.clientY,
      orig: { x: b.x ?? 0, y: b.y ?? 0, w: b.w ?? 100, h: b.h ?? 100 },
    });
  };

  const onHandlePointerDown = (
    e: React.PointerEvent,
    b: StoryBlock,
    handle: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(b.id);
    startGesture({
      kind: "resize",
      id: b.id,
      handle,
      sx: e.clientX,
      sy: e.clientY,
      orig: { x: b.x ?? 0, y: b.y ?? 0, w: b.w ?? 100, h: b.h ?? 100 },
    });
  };

  // ---- keyboard nudge / delete ----
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!selectedId || editingId) return;
      const b = blocks.find((x) => x.id === selectedId);
      if (!b) return;
      if (e.key === "Delete") {
        e.preventDefault();
        removeBlock(selectedId);
        return;
      }
      const step = e.shiftKey ? GRID * 5 : GRID;
      const nudge: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
      };
      const mv = nudge[e.key];
      if (mv) {
        e.preventDefault();
        setGeometry(selectedId, {
          x: clamp((b.x ?? 0) + mv[0], 0, CANVAS_W - (b.w ?? 0)),
          y: Math.max(0, (b.y ?? 0) + mv[1]),
          w: b.w ?? 100,
          h: b.h ?? 100,
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, editingId, blocks]);

  async function replaceImage(id: string, file: File) {
    setUploading(true);
    try {
      const url = await onUploadImage(file);
      patchData(id, { url });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Insert toolbar */}
      <div className="bg-card/70 flex flex-wrap items-center gap-1.5 rounded-lg border p-2">
        <ToolButton icon={<Type className="size-4" />} label={t.text} onClick={() => addBlock("text")} />
        <ToolButton icon={<HeadingIcon className="size-4" />} label={t.heading} onClick={() => addBlock("heading")} />
        <ToolButton icon={<ImageIcon className="size-4" />} label={t.image} onClick={() => addBlock("image")} />
        <ToolButton icon={<Square className="size-4" />} label={t.box} onClick={() => addBlock("box")} />
        <span className="bg-border mx-1 h-6 w-px" />
        <label className="hover:bg-accent flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-sm">
          <span
            className="size-4 rounded border"
            style={{ background: value.canvas?.background || "transparent" }}
          />
          {t.bg}
          <input
            type="color"
            className="sr-only"
            value={(value.canvas?.background as string) || "#f5efe4"}
            onChange={(e) => commit(blocks, { background: e.target.value })}
          />
        </label>
        {value.canvas?.background && (
          <ToolButton
            label={t.clearBg}
            onClick={() => commit(blocks, { background: undefined })}
          />
        )}
        <span className="bg-border mx-1 h-6 w-px" />
        <ToolButton
          label={t.addSpace}
          onClick={() => commit(blocks, { height: height + 240 })}
        />
      </div>

      {/* Contextual toolbar */}
      {selected && (
        <div className="bg-card/70 flex flex-wrap items-center gap-1.5 rounded-lg border p-2">
          {(selected.type === "text" || selected.type === "heading") && (
            <>
              <select
                className="border-input bg-background h-8 rounded-md border px-1.5 text-sm"
                value={(selected.data?.font as string) ?? "serif"}
                onChange={(e) => patchData(selected.id, { font: e.target.value })}
                title="Font"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value} style={{ fontFamily: f.stack }}>
                    {f.label}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={10}
                max={120}
                className="border-input bg-background h-8 w-16 rounded-md border px-2 text-sm"
                value={(selected.data?.fontSize as number) ?? 19}
                onChange={(e) =>
                  patchData(selected.id, { fontSize: Number(e.target.value) || 19 })
                }
              />
              <IconToggle
                active={Boolean(
                  selected.data?.bold ?? selected.type === "heading",
                )}
                onClick={() =>
                  patchData(selected.id, {
                    bold: !(selected.data?.bold ?? selected.type === "heading"),
                  })
                }
              >
                <Bold className="size-4" />
              </IconToggle>
              <IconToggle
                active={Boolean(selected.data?.italic)}
                onClick={() =>
                  patchData(selected.id, { italic: !selected.data?.italic })
                }
              >
                <Italic className="size-4" />
              </IconToggle>
              <span className="bg-border mx-1 h-6 w-px" />
              {(["left", "center", "right"] as const).map((a) => (
                <IconToggle
                  key={a}
                  active={(selected.data?.align ?? "left") === a}
                  onClick={() => patchData(selected.id, { align: a })}
                >
                  {a === "left" ? (
                    <AlignLeft className="size-4" />
                  ) : a === "center" ? (
                    <AlignCenter className="size-4" />
                  ) : (
                    <AlignRight className="size-4" />
                  )}
                </IconToggle>
              ))}
              <span className="bg-border mx-1 h-6 w-px" />
              <ColorPick
                title="A"
                value={(selected.data?.color as string) || "#3d3226"}
                onChange={(c) => patchData(selected.id, { color: c })}
              />
            </>
          )}

          {selected.type === "image" && (
            <>
              <label className="hover:bg-accent flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-sm">
                {uploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}
                {t.replace}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    e.target.files?.[0] && replaceImage(selected.id, e.target.files[0])
                  }
                />
              </label>
              <IconToggle
                active={(selected.data?.fit ?? "cover") === "contain"}
                onClick={() =>
                  patchData(selected.id, {
                    fit:
                      (selected.data?.fit ?? "cover") === "cover"
                        ? "contain"
                        : "cover",
                  })
                }
              >
                <span className="text-xs">{t.fit}</span>
              </IconToggle>
            </>
          )}

          {(selected.type === "box" ||
            selected.type === "text" ||
            selected.type === "heading") && (
            <ColorPick
              title={selected.type === "box" ? "■" : "▧"}
              value={
                (selected.data?.bg as string) ||
                (selected.type === "box" ? "#e9dcc9" : "#ffffff")
              }
              onChange={(c) => patchData(selected.id, { bg: c })}
              clearable={selected.type !== "box"}
              onClear={() => patchData(selected.id, { bg: undefined })}
            />
          )}

          <span className="bg-border mx-1 h-6 w-px" />
          <ToolButton
            icon={<Copy className="size-4" />}
            onClick={() => duplicate(selected.id)}
            title={t.duplicate}
          />
          <ToolButton
            icon={<ArrowUp className="size-4" />}
            onClick={() => restack(selected.id, 1)}
            title={t.forward}
          />
          <ToolButton
            icon={<ArrowDown className="size-4" />}
            onClick={() => restack(selected.id, -1)}
            title={t.backward}
          />
          <ToolButton
            icon={<Trash2 className="text-destructive size-4" />}
            onClick={() => removeBlock(selected.id)}
            title={t.delete}
          />
        </div>
      )}

      <p className="text-muted-foreground text-xs">{t.hint}</p>

      {/* Canvas surface */}
      <div
        ref={wrapRef}
        className="bg-muted/40 mx-auto w-full overflow-hidden rounded-xl border"
        style={{ maxWidth: CANVAS_W, height: height * scale }}
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) {
            setSelectedId(null);
            setEditingId(null);
          }
        }}
      >
        <div
          className="relative"
          style={{
            width: CANVAS_W,
            height,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            background: value.canvas?.background || "var(--color-card)",
            touchAction: "none",
          }}
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedId(null);
              setEditingId(null);
            }
          }}
        >
          {blocks.length === 0 && (
            <div className="text-muted-foreground pointer-events-none absolute inset-0 flex items-center justify-center text-sm">
              {t.empty}
            </div>
          )}
          {[...blocks]
            .sort((a, b) => (a.z ?? 0) - (b.z ?? 0))
            .map((b) => {
              const isSel = b.id === selectedId;
              const isEditing = b.id === editingId;
              return (
                <div
                  key={b.id}
                  className={cn(
                    "absolute",
                    !isEditing && "cursor-move",
                  )}
                  style={{
                    left: b.x ?? 0,
                    top: b.y ?? 0,
                    width: b.w ?? 100,
                    height: b.h ?? 100,
                    zIndex: b.z ?? 0,
                    outline: isSel
                      ? "2px solid var(--color-primary)"
                      : "1px dashed transparent",
                    outlineOffset: 2,
                  }}
                  onPointerDown={(e) => onBodyPointerDown(e, b)}
                  onDoubleClick={() => {
                    if (b.type === "text" || b.type === "heading") {
                      setSelectedId(b.id);
                      setEditingId(b.id);
                    }
                  }}
                >
                  {isEditing ? (
                    <textarea
                      autoFocus
                      value={(b.data?.text as string) ?? ""}
                      placeholder={t.typeHere}
                      onChange={(e) => patchData(b.id, { text: e.target.value })}
                      onBlur={() => setEditingId(null)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setEditingId(null);
                        e.stopPropagation();
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                      className="size-full resize-none border-0 bg-transparent p-0 outline-none"
                      style={{
                        ...textBlockStyle(b),
                        padding: (b.data?.bg as string) ? 12 : 0,
                        background: (b.data?.bg as string) || "transparent",
                        borderRadius: (b.data?.bg as string) ? 12 : 0,
                      }}
                    />
                  ) : (
                    <div className="pointer-events-none size-full">
                      <BlockView block={b} />
                    </div>
                  )}

                  {isSel &&
                    !isEditing &&
                    HANDLES.map((h) => (
                      <span
                        key={h.pos}
                        onPointerDown={(e) => onHandlePointerDown(e, b, h.pos)}
                        className="bg-primary absolute z-10 size-2.5 rounded-full border border-white shadow"
                        style={{ ...h.style, cursor: h.cursor }}
                      />
                    ))}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

function ToolButton({
  icon,
  label,
  onClick,
  title,
}: {
  icon?: React.ReactNode;
  label?: string;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title ?? label}
      className="hover:bg-accent flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors"
    >
      {icon}
      {label && <span>{label}</span>}
    </button>
  );
}

function IconToggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex size-8 items-center justify-center rounded-md transition-colors",
        active ? "bg-primary text-primary-foreground" : "hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}

function ColorPick({
  title,
  value,
  onChange,
  clearable,
  onClear,
}: {
  title: string;
  value: string;
  onChange: (c: string) => void;
  clearable?: boolean;
  onClear?: () => void;
}) {
  return (
    <span className="flex items-center">
      <label className="hover:bg-accent flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-1 text-sm">
        <span className="font-serif text-sm leading-none">{title}</span>
        <span
          className="size-4 rounded border"
          style={{ background: value }}
        />
        <input
          type="color"
          className="sr-only"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
      {clearable && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="text-muted-foreground hover:text-foreground px-1 text-xs"
          title="×"
        >
          ×
        </button>
      )}
    </span>
  );
}

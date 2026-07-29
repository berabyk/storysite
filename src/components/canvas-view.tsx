import * as React from "react";

import type { StoryBlock, StoryDocument } from "@/lib/types";

export const CANVAS_W = 800;

export function docHeight(doc: StoryDocument): number {
  const max = doc.blocks.reduce(
    (m, b) => Math.max(m, (b.y ?? 0) + (b.h ?? 0)),
    0,
  );
  // Honour an explicit (author-added) height but never crop the content.
  return Math.max(doc.canvas?.height ?? 0, max + 48, 480);
}

/** Curated font choices (system fonts + the two self-hosted faces, so no
 * external downloads / CSP issues). */
export const FONT_OPTIONS: { value: string; label: string; stack: string }[] = [
  { value: "serif", label: "Fraunces", stack: "var(--font-serif)" },
  { value: "sans", label: "Inter", stack: "var(--font-sans)" },
  { value: "georgia", label: "Georgia", stack: "Georgia, 'Times New Roman', serif" },
  {
    value: "garamond",
    label: "Garamond",
    stack: "Garamond, 'Palatino Linotype', 'Book Antiqua', serif",
  },
  { value: "helvetica", label: "Helvetica", stack: "Helvetica, Arial, sans-serif" },
  { value: "verdana", label: "Verdana", stack: "Verdana, Geneva, sans-serif" },
  { value: "courier", label: "Courier", stack: "'Courier New', Courier, monospace" },
  { value: "mono", label: "Mono", stack: "ui-monospace, SFMono-Regular, Menlo, monospace" },
  { value: "comic", label: "Comic", stack: "'Comic Sans MS', 'Comic Sans', cursive" },
  { value: "script", label: "El yazısı", stack: "'Brush Script MT', 'Segoe Script', cursive" },
];

/** Font stack for a text/heading block. */
export function blockFontFamily(font: unknown): string {
  const match = FONT_OPTIONS.find((o) => o.value === font);
  return match ? match.stack : "var(--font-serif)";
}

/** Shared text style so the editor and the reader render identically. */
export function textBlockStyle(b: StoryBlock): React.CSSProperties {
  const d = b.data ?? {};
  const isHeading = b.type === "heading";
  const bold = d.bold === undefined ? isHeading : Boolean(d.bold);
  return {
    fontFamily: blockFontFamily(d.font),
    fontSize: (d.fontSize as number) ?? (isHeading ? 34 : 19),
    fontWeight: bold ? 700 : 400,
    fontStyle: (d.italic as boolean) ? "italic" : "normal",
    lineHeight: isHeading ? 1.15 : 1.65,
    textAlign: (d.align as React.CSSProperties["textAlign"]) ?? "left",
    color: (d.color as string) ?? "var(--color-foreground)",
    whiteSpace: "pre-wrap",
    overflowWrap: "break-word",
    wordBreak: "break-word",
  };
}

/** Read-only renderer for canvas-mode documents: absolute layout scaled to fit. */
export function CanvasView({ document: doc }: { document: StoryDocument }) {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const width = doc.canvas?.width ?? CANVAS_W;
  const height = docHeight(doc);
  const [scale, setScale] = React.useState(1);

  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setScale(Math.min(1, el.clientWidth / width));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);

  return (
    <div
      ref={wrapRef}
      className="mx-auto w-full"
      style={{ maxWidth: width, height: height * scale, position: "relative" }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width,
          height,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          background: doc.canvas?.background,
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        {[...doc.blocks]
          .sort((a, b) => (a.z ?? 0) - (b.z ?? 0))
          .map((b) => (
            <div
              key={b.id}
              style={{
                position: "absolute",
                left: b.x ?? 0,
                top: b.y ?? 0,
                width: b.w ?? 200,
                height: b.h ?? 80,
                zIndex: b.z ?? 0,
              }}
            >
              <BlockView block={b} />
            </div>
          ))}
      </div>
    </div>
  );
}

export function BlockView({ block: b }: { block: StoryBlock }) {
  const d = b.data ?? {};

  if (b.type === "image") {
    return d.url ? (
      <img
        src={d.url as string}
        alt={(d.alt as string) ?? ""}
        draggable={false}
        style={{
          width: "100%",
          height: "100%",
          objectFit: (d.fit as "cover" | "contain") ?? "cover",
          borderRadius: (d.radius as number) ?? 12,
          display: "block",
        }}
      />
    ) : null;
  }

  if (b.type === "box" || b.type === "divider") {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: (d.bg as string) ?? "var(--color-accent)",
          borderRadius: (d.radius as number) ?? 12,
        }}
      />
    );
  }

  if (b.type === "html") {
    return (
      <div
        className="prose"
        style={{ maxWidth: "none" }}
        dangerouslySetInnerHTML={{ __html: (d.html as string) ?? "" }}
      />
    );
  }

  // text / heading
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        padding: (d.bg as string) ? 12 : 0,
        background: (d.bg as string) || undefined,
        borderRadius: (d.bg as string) ? 12 : 0,
        ...textBlockStyle(b),
      }}
    >
      {(d.text as string) ?? ""}
    </div>
  );
}

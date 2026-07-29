import * as React from "react";

import { cn } from "@/lib/utils";
import type { StoryBlock, StoryDocument } from "@/lib/types";
import { CANVAS_W, CanvasView } from "@/components/canvas-view";

/** Renders an editor block document, styled for reading. */
export function StoryContent({
  document,
  className,
}: {
  document?: StoryDocument | null;
  className?: string;
}) {
  const blocks = document?.blocks ?? [];
  if (blocks.length === 0) return null;

  // Whole-document free-form canvas.
  if (document?.mode === "canvas") {
    return (
      <div className={className}>
        <CanvasView document={document} />
      </div>
    );
  }

  // Flow / hybrid: a sequence of blocks, where a "canvas" block is a design
  // zone. Group consecutive flow blocks so prose spacing (and the drop cap)
  // works, and render each canvas zone between the groups.
  const groups = groupBlocks(blocks);
  return (
    <div className={cn("flex flex-col gap-8", className)}>
      {groups.map((g, i) =>
        g.kind === "zone" ? (
          <ZoneView key={i} block={g.block} />
        ) : (
          <div key={i} className="prose">
            {g.blocks.map((block) => (
              <Block key={block.id} block={block} />
            ))}
          </div>
        ),
      )}
    </div>
  );
}

type Group =
  | { kind: "flow"; blocks: StoryBlock[] }
  | { kind: "zone"; block: StoryBlock };

function groupBlocks(blocks: StoryBlock[]): Group[] {
  const groups: Group[] = [];
  let current: StoryBlock[] = [];
  for (const b of blocks) {
    if (b.type === "canvas") {
      if (current.length) {
        groups.push({ kind: "flow", blocks: current });
        current = [];
      }
      groups.push({ kind: "zone", block: b });
    } else {
      current.push(b);
    }
  }
  if (current.length) groups.push({ kind: "flow", blocks: current });
  return groups;
}

/** A free-form design zone, rendered read-only and scaled to fit. */
function ZoneView({ block }: { block: StoryBlock }) {
  const zone = block.data?.zone;
  if (!zone?.blocks?.length) return null;
  const doc: StoryDocument = {
    version: 1,
    mode: "canvas",
    canvas: {
      width: CANVAS_W,
      height: zone.height,
      background: zone.background,
    },
    blocks: zone.blocks,
  };
  return <CanvasView document={doc} />;
}

function Block({ block }: { block: StoryBlock }) {
  const d = block.data ?? {};
  switch (block.type) {
    case "html":
      return <div dangerouslySetInnerHTML={{ __html: d.html ?? "" }} />;
    case "heading": {
      const level = Math.min(3, Math.max(2, (d.level as number) ?? 2));
      return React.createElement(`h${level}`, null, d.text ?? "");
    }
    case "image":
      return d.url ? (
        <img src={d.url} alt={d.alt ?? ""} loading="lazy" />
      ) : null;
    case "divider":
      return <hr />;
    case "text":
    default: {
      if (d.html) return <div dangerouslySetInnerHTML={{ __html: d.html }} />;
      const paras = (d.text ?? "")
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean);
      return (
        <>
          {paras.map((p, i) => (
            <p key={i} className="break-words whitespace-pre-wrap">
              {p}
            </p>
          ))}
        </>
      );
    }
  }
}

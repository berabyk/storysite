import * as React from "react";

import { cn } from "@/lib/utils";
import type { StoryBlock, StoryDocument } from "@/lib/types";

/** Renders an editor block document in flow order, styled for reading. */
export function StoryContent({
  document,
  className,
}: {
  document?: StoryDocument | null;
  className?: string;
}) {
  const blocks = document?.blocks ?? [];
  if (blocks.length === 0) return null;
  return (
    <div className={cn("prose", className)}>
      {blocks.map((block) => (
        <Block key={block.id} block={block} />
      ))}
    </div>
  );
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
            <p key={i} style={{ whiteSpace: "pre-wrap" }}>
              {p}
            </p>
          ))}
        </>
      );
    }
  }
}

export type Locale = "tr" | "en";

/** A free-form design region embedded inside a flow document. */
export interface CanvasZone {
  blocks: StoryBlock[];
  height?: number;
  background?: string;
}

/** A block in the editor document. */
export interface StoryBlock {
  id: string;
  type:
    | "html"
    | "text"
    | "heading"
    | "image"
    | "box"
    | "divider"
    | "canvas"
    | string;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  z?: number;
  data?: {
    html?: string;
    text?: string;
    level?: number;
    url?: string;
    alt?: string;
    align?: "left" | "center" | "right";
    fontSize?: number;
    font?: "serif" | "sans";
    color?: string;
    bg?: string;
    bold?: boolean;
    italic?: boolean;
    radius?: number;
    fit?: "cover" | "contain";
    /** For a "canvas" (design zone) block: its nested free-form layout. */
    zone?: CanvasZone;
    [key: string]: unknown;
  };
}

/** The editor document stored per story/character (jsonb on the backend). */
export interface StoryDocument {
  version?: number;
  /**
   * "canvas" = the whole document is one free drag/resize layout.
   * "flow" / "hybrid" = a sequence of blocks (the classic layout), which may
   * include "canvas" design-zone blocks. Undefined is treated as flow.
   */
  mode?: "canvas" | "flow" | "hybrid";
  canvas?: { width?: number; height?: number; background?: string };
  blocks: StoryBlock[];
}

/** Lightweight metadata used in listing/grid views. */
export interface StorySummary {
  id: string;
  slug: string;
  title: string;
  explanation: string;
  image: string | null;
  createdTime: string;
  characters: string[];
  viewCount?: number;
  likeCount?: number;
  authorName?: string;
  authorUserName?: string;
}

/** Full story, including the editor block document. */
export interface Story extends StorySummary {
  content: StoryDocument;
  viewCount?: number;
  likeCount?: number;
  likedByMe?: boolean;
  authorName?: string;
}

export interface CharacterSummary {
  id: string;
  slug: string;
  name: string;
  explanation: string;
  image: string | null;
  kind: string;
}

export interface Character extends CharacterSummary {
  content: StoryDocument;
  /** Stories this character appears in. */
  stories: StorySummary[];
}

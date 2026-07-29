export type Locale = "tr" | "en";

/** A block in the drag-and-drop editor document. */
export interface StoryBlock {
  id: string;
  type: "html" | "text" | "heading" | "image" | "box" | "divider" | string;
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
    [key: string]: unknown;
  };
}

/** The editor document stored per story/character (jsonb on the backend). */
export interface StoryDocument {
  version?: number;
  /** "canvas" = free drag/resize layout; otherwise flow (legacy / imported). */
  mode?: "canvas" | "flow";
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

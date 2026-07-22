export type Locale = "tr" | "en";

/** Lightweight metadata used in listing/grid views. */
export interface StorySummary {
  id: string;
  slug: string;
  title: string;
  explanation: string;
  image: string | null;
  createdTime: string;
  characters: string[];
}

/** Full story, including the pre-rendered HTML body. */
export interface Story extends StorySummary {
  /** HTML pre-rendered from Notion blocks at build time. */
  content: string;
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
  /** HTML pre-rendered from Notion blocks at build time. */
  content: string;
  /** Stories this character appears in (resolved at build time). */
  stories: StorySummary[];
}

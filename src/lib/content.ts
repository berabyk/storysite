import type {
  Character,
  CharacterSummary,
  Locale,
  Story,
  StorySummary,
} from "./types";

/**
 * Data-access layer.
 *
 * Today this reads static JSON generated at build time from Notion
 * (see `scripts/fetch-notion.mjs`), so there are ZERO Notion calls at
 * runtime — the site is as fast as static files on a CDN.
 *
 * Later, when a real backend exists (e.g. on a Linux server), only this
 * file needs to change: point `BASE` at the API and keep the same function
 * signatures. The rest of the app is untouched.
 */

const BASE = import.meta.env.VITE_CONTENT_BASE ?? "/content";

const cache = new Map<string, unknown>();

async function getJSON<T>(path: string): Promise<T | null> {
  if (cache.has(path)) return cache.get(path) as T;
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    const data = (await res.json()) as T;
    cache.set(path, data);
    return data;
  } catch {
    return null;
  }
}

export async function getStories(locale: Locale): Promise<StorySummary[]> {
  return (await getJSON<StorySummary[]>(`${BASE}/${locale}/stories.json`)) ?? [];
}

export async function getStory(
  locale: Locale,
  slug: string,
): Promise<Story | null> {
  return getJSON<Story>(`${BASE}/${locale}/stories/${slug}.json`);
}

export async function getCharacters(
  locale: Locale,
): Promise<CharacterSummary[]> {
  return (
    (await getJSON<CharacterSummary[]>(`${BASE}/${locale}/characters.json`)) ??
    []
  );
}

export async function getCharacter(
  locale: Locale,
  slug: string,
): Promise<Character | null> {
  return getJSON<Character>(`${BASE}/${locale}/characters/${slug}.json`);
}

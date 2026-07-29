import { api, apiJson } from "./api";
import type { Locale } from "./types";

/** Optional, D&D-style character-sheet fields, stored inside the character
 * document (ContentJson) so no backend schema change is required. */
export interface CharacterSheet {
  age?: string;
  pronouns?: string;
  role?: string;
  traits?: string[];
  appearance?: string;
  background?: string;
}

export interface CharacterDoc {
  version: number;
  sheet?: CharacterSheet;
  blocks: unknown[];
}

export interface CharacterInput {
  name: string;
  explanation?: string;
  kind?: string;
  imageUrl?: string | null;
  content?: CharacterDoc;
  language: string;
}

/** Read the sheet out of a character document (tolerant of shape). */
export function readSheet(content: unknown): CharacterSheet {
  const sheet = (content as { sheet?: CharacterSheet } | null)?.sheet;
  return sheet && typeof sheet === "object" ? sheet : {};
}

export function isAdmin(roles?: string[] | null): boolean {
  return Boolean(roles?.includes("Admin"));
}

export function createCharacter(body: CharacterInput) {
  return apiJson<{ id: string; slug: string }>("/api/characters", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateCharacter(id: string, body: CharacterInput) {
  return apiJson<{ id: string; slug: string }>(`/api/characters/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function deleteCharacter(id: string) {
  return api.request(`/api/characters/${id}`, { method: "DELETE" });
}

/** All characters for a locale (used by the admin panel and story editor). */
export async function listCharacters(locale: Locale) {
  return (
    (await apiJson<
      {
        id: string;
        name: string;
        slug: string;
        explanation: string;
        kind: string;
        imageUrl?: string | null;
        language: string;
      }[]
    >(`/api/characters?language=${locale}`).catch(() => null)) ?? []
  );
}

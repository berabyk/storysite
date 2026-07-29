import { api, apiJson } from "./api";
import type {
  Author,
  CharacterSummary,
  Locale,
  StorySummary,
} from "./types";

interface AuthorDto {
  id: string;
  userName: string;
  displayName: string;
  avatarUrl?: string | null;
}

interface StoryItemDto {
  id: string;
  title: string;
  slug: string;
  summary: string;
  coverImageUrl?: string | null;
  language: string;
  viewCount: number;
  likeCount: number;
  author: AuthorDto;
  publishedAt?: string | null;
  createdAt: string;
  genre?: string | null;
  tags?: string[];
  pinned?: boolean;
}

interface CharacterItemDto {
  id: string;
  name: string;
  slug: string;
  explanation: string;
  kind: string;
  imageUrl?: string | null;
  language: string;
}

interface UniverseListItemDto {
  id: string;
  name: string;
  slug: string;
  description: string;
  coverImageUrl?: string | null;
  language: string;
  owner: AuthorDto;
  storyCount: number;
  characterCount: number;
}

interface UniverseDetailDto extends UniverseListItemDto {
  stories: StoryItemDto[];
  characters: CharacterItemDto[];
}

export interface UniverseListItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  coverImageUrl: string | null;
  language: Locale;
  owner: Author;
  storyCount: number;
  characterCount: number;
}

export interface UniverseDetail extends UniverseListItem {
  stories: StorySummary[];
  characters: CharacterSummary[];
}

export interface UniverseInput {
  name: string;
  description?: string;
  coverImageUrl?: string | null;
  language: string;
}

function toAuthor(a: AuthorDto | undefined): Author {
  return {
    id: a?.id ?? "",
    userName: a?.userName ?? "",
    displayName: a?.displayName ?? "",
    avatarUrl: a?.avatarUrl ?? null,
  };
}

function toListItem(u: UniverseListItemDto): UniverseListItem {
  return {
    id: u.id,
    name: u.name,
    slug: u.slug,
    description: u.description ?? "",
    coverImageUrl: u.coverImageUrl ?? null,
    language: (u.language as Locale) ?? "tr",
    owner: toAuthor(u.owner),
    storyCount: u.storyCount,
    characterCount: u.characterCount,
  };
}

function storyToSummary(s: StoryItemDto): StorySummary {
  return {
    id: s.id,
    slug: s.slug,
    title: s.title,
    explanation: s.summary ?? "",
    image: s.coverImageUrl ?? null,
    createdTime: s.publishedAt ?? s.createdAt,
    characters: [],
    viewCount: s.viewCount,
    likeCount: s.likeCount,
    authorName: s.author?.displayName,
    authorUserName: s.author?.userName,
    language: (s.language as Locale) ?? "tr",
    genre: s.genre ?? null,
    tags: s.tags ?? [],
    pinned: s.pinned ?? false,
  };
}

function charToSummary(c: CharacterItemDto): CharacterSummary {
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    explanation: c.explanation ?? "",
    image: c.imageUrl ?? null,
    kind: c.kind ?? "",
    language: (c.language as Locale) ?? "tr",
  };
}

export async function listUniverses(locale: Locale): Promise<UniverseListItem[]> {
  const res = await apiJson<UniverseListItemDto[]>(
    `/api/universes?language=${locale}`,
  ).catch(() => null);
  return res ? res.map(toListItem) : [];
}

export async function listMyUniverses(): Promise<UniverseListItem[]> {
  const res = await apiJson<UniverseListItemDto[]>("/api/universes/mine").catch(
    () => null,
  );
  return res ? res.map(toListItem) : [];
}

export async function getUniverse(
  locale: Locale,
  slug: string,
): Promise<UniverseDetail | null> {
  const u = await apiJson<UniverseDetailDto>(
    `/api/universes/${locale}/${encodeURIComponent(slug)}`,
  ).catch(() => null);
  if (!u) return null;
  return {
    ...toListItem(u),
    stories: (u.stories ?? []).map(storyToSummary),
    characters: (u.characters ?? []).map(charToSummary),
  };
}

export function createUniverse(body: UniverseInput) {
  return apiJson<UniverseListItemDto>("/api/universes", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateUniverse(id: string, body: UniverseInput) {
  return apiJson<UniverseListItemDto>(`/api/universes/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function deleteUniverse(id: string) {
  return api.request(`/api/universes/${id}`, { method: "DELETE" });
}

import { apiJson } from "./api";
import type {
  Character,
  CharacterSummary,
  Locale,
  Story,
  StoryDocument,
  StorySummary,
} from "./types";

/**
 * Data-access layer — now backed by the StorySite API (.NET / Cloud Run).
 *
 * The UI calls these four functions; only this file knows about the API shape.
 */

interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

interface AuthorDto {
  id: string;
  userName: string;
  displayName: string;
  avatarUrl?: string | null;
}

interface StoryListItemDto {
  id: string;
  title: string;
  slug: string;
  summary: string;
  coverImageUrl?: string | null;
  language: string;
  status: number;
  viewCount: number;
  likeCount: number;
  author: AuthorDto;
  publishedAt?: string | null;
  createdAt: string;
}

interface StoryDetailDto extends StoryListItemDto {
  content: StoryDocument;
  likedByMe: boolean;
  updatedAt: string;
}

interface CharacterListItemDto {
  id: string;
  name: string;
  slug: string;
  explanation: string;
  kind: string;
  imageUrl?: string | null;
  language: string;
}

interface CharacterDetailDto extends CharacterListItemDto {
  content: StoryDocument;
  stories: StoryListItemDto[];
}

const EMPTY_DOC: StoryDocument = { version: 1, blocks: [] };

function toStorySummary(s: StoryListItemDto): StorySummary {
  return {
    id: s.id,
    slug: s.slug,
    title: s.title,
    explanation: s.summary ?? "",
    image: s.coverImageUrl ?? null,
    createdTime: s.publishedAt ?? s.createdAt,
    characters: [],
  };
}

export async function getStories(locale: Locale): Promise<StorySummary[]> {
  const res = await apiJson<PagedResult<StoryListItemDto>>(
    `/api/stories?language=${locale}&pageSize=50`,
  ).catch(() => null);
  return res ? res.items.map(toStorySummary) : [];
}

export async function getStory(
  locale: Locale,
  slug: string,
): Promise<Story | null> {
  const s = await apiJson<StoryDetailDto>(
    `/api/stories/${locale}/${encodeURIComponent(slug)}`,
  ).catch(() => null);
  if (!s) return null;
  return {
    ...toStorySummary(s),
    content: s.content ?? EMPTY_DOC,
    viewCount: s.viewCount,
    likeCount: s.likeCount,
    likedByMe: s.likedByMe,
    authorName: s.author?.displayName,
  };
}

export async function getCharacters(
  locale: Locale,
): Promise<CharacterSummary[]> {
  const res = await apiJson<CharacterListItemDto[]>(
    `/api/characters?language=${locale}`,
  ).catch(() => null);
  return res
    ? res.map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        explanation: c.explanation ?? "",
        image: c.imageUrl ?? null,
        kind: c.kind ?? "",
      }))
    : [];
}

export async function getCharacter(
  locale: Locale,
  slug: string,
): Promise<Character | null> {
  const c = await apiJson<CharacterDetailDto>(
    `/api/characters/${locale}/${encodeURIComponent(slug)}`,
  ).catch(() => null);
  if (!c) return null;
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    explanation: c.explanation ?? "",
    image: c.imageUrl ?? null,
    kind: c.kind ?? "",
    content: c.content ?? EMPTY_DOC,
    stories: (c.stories ?? []).map(toStorySummary),
  };
}

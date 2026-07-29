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
  genre?: string | null;
  tags?: string[];
  pinned?: boolean;
}

interface StoryDetailDto extends StoryListItemDto {
  content: StoryDocument;
  likedByMe: boolean;
  updatedAt: string;
  characterRefs?: string[];
  coauthors?: AuthorDto[];
  universeId?: string | null;
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
  universeId?: string | null;
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

export interface StoryQuery {
  sort?: "popular" | "recent";
  author?: string;
  q?: string;
  genre?: string;
  tag?: string;
  universeId?: string;
  /** Override the language filter; "all" fetches every language. */
  language?: Locale | "all";
  pageSize?: number;
}

export async function getStories(
  locale: Locale,
  opts: StoryQuery = {},
): Promise<StorySummary[]> {
  const params = new URLSearchParams({ pageSize: String(opts.pageSize ?? 50) });
  const lang = opts.language ?? locale;
  if (lang !== "all") params.set("language", lang);
  if (opts.sort === "popular") params.set("sort", "popular");
  if (opts.author) params.set("author", opts.author);
  if (opts.q) params.set("q", opts.q);
  if (opts.genre) params.set("genre", opts.genre);
  if (opts.tag) params.set("tag", opts.tag);
  if (opts.universeId) params.set("universeId", opts.universeId);
  const res = await apiJson<PagedResult<StoryListItemDto>>(
    `/api/stories?${params.toString()}`,
  ).catch(() => null);
  return res ? res.items.map(toStorySummary) : [];
}

/** Stories the signed-in user has saved. */
export async function getSavedStories(): Promise<StorySummary[]> {
  const res = await apiJson<StoryListItemDto[]>("/api/stories/saved").catch(
    () => null,
  );
  return res ? res.map(toStorySummary) : [];
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
    characters: s.characterRefs ?? [],
    content: s.content ?? EMPTY_DOC,
    viewCount: s.viewCount,
    likeCount: s.likeCount,
    likedByMe: s.likedByMe,
    authorName: s.author?.displayName,
    coauthors: (s.coauthors ?? []).map((a) => ({
      id: a.id,
      userName: a.userName,
      displayName: a.displayName,
      avatarUrl: a.avatarUrl ?? null,
    })),
    universeId: s.universeId ?? null,
  };
}

export async function getCharacters(
  locale: Locale,
  universeId?: string,
): Promise<CharacterSummary[]> {
  const params = new URLSearchParams({ language: locale });
  if (universeId) params.set("universeId", universeId);
  const res = await apiJson<CharacterListItemDto[]>(
    `/api/characters?${params.toString()}`,
  ).catch(() => null);
  return res
    ? res.map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        explanation: c.explanation ?? "",
        image: c.imageUrl ?? null,
        kind: c.kind ?? "",
        language: (c.language as Locale) ?? "tr",
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
    language: (c.language as Locale) ?? "tr",
    content: c.content ?? EMPTY_DOC,
    stories: (c.stories ?? []).map(toStorySummary),
    universeId: c.universeId ?? null,
  };
}

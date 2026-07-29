import { api, apiJson } from "./api";
import type { StoryDocument } from "./types";

export const StoryStatus = { Draft: 0, Published: 1, Archived: 2 } as const;

export interface MyStory {
  id: string;
  title: string;
  slug: string;
  summary: string;
  coverImageUrl?: string | null;
  language: string;
  status: number;
  viewCount: number;
  likeCount: number;
  createdAt: string;
  publishedAt?: string | null;
}

export interface StoryInput {
  title: string;
  summary?: string;
  coverImageUrl?: string | null;
  content: StoryDocument;
  language: string;
  characterRefs?: string[];
  genre?: string | null;
  tags?: string[];
}

export function pinStory(id: string) {
  return api.request(`/api/stories/${id}/pin`, { method: "POST" });
}

export function unpinStory(id: string) {
  return api.request(`/api/stories/${id}/pin`, { method: "DELETE" });
}

export function getMyStories() {
  return apiJson<MyStory[]>("/api/stories/mine");
}

export function createStory(body: StoryInput) {
  return apiJson<{ id: string; slug: string; language: string }>("/api/stories", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateStory(id: string, body: StoryInput) {
  return apiJson<{ id: string; slug: string; language: string }>(
    `/api/stories/${id}`,
    { method: "PUT", body: JSON.stringify(body) },
  );
}

export function publishStory(id: string) {
  return api.request(`/api/stories/${id}/publish`, { method: "POST" });
}

export function unpublishStory(id: string) {
  return api.request(`/api/stories/${id}/unpublish`, { method: "POST" });
}

export function deleteStory(id: string) {
  return api.request(`/api/stories/${id}`, { method: "DELETE" });
}

/** Uploads an image and returns its URL. */
export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await apiJson<{ url: string }>("/api/media", {
    method: "POST",
    body: form,
  });
  return res.url;
}

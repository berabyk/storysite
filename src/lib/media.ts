import { api, apiJson } from "./api";

export interface MediaItem {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
  contentType: string;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
  createdAt: string;
}

/** The current user's uploaded images, newest first. */
export function listMyMedia(): Promise<MediaItem[]> {
  return apiJson<MediaItem[]>("/api/media/mine").catch(() => []);
}

/** Deletes one of the current user's uploads. */
export function deleteMedia(id: string): Promise<Response> {
  return api.request(`/api/media/${id}`, { method: "DELETE" });
}

/** Uploads an image and returns the full stored record. */
export async function uploadMedia(file: File): Promise<MediaItem> {
  const form = new FormData();
  form.append("file", file);
  return apiJson<MediaItem>("/api/media", { method: "POST", body: form });
}

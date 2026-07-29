import { apiJson } from "./api";

export function likeStory(id: string) {
  return apiJson<{ liked: boolean; likeCount: number }>(
    `/api/stories/${id}/like`,
    { method: "POST" },
  );
}

export function unlikeStory(id: string) {
  return apiJson<{ liked: boolean; likeCount: number }>(
    `/api/stories/${id}/like`,
    { method: "DELETE" },
  );
}

export function recordView(id: string) {
  return apiJson<{ viewCount: number }>(`/api/stories/${id}/view`, {
    method: "POST",
  });
}

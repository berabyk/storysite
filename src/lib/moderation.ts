import { api, apiJson } from "./api";

export const ReportStatus = { Open: 0, Resolved: 1, Dismissed: 2 } as const;

export interface Report {
  id: string;
  storyId: string;
  storyTitle: string;
  storySlug: string;
  storyLanguage: string;
  reason: string;
  status: number;
  createdAt: string;
}

/** A signed-in user flags a story as inappropriate. */
export function reportStory(storyId: string, reason: string) {
  return apiJson<void>("/api/reports", {
    method: "POST",
    body: JSON.stringify({ storyId, reason }),
  });
}

export async function listReports(all = false): Promise<Report[]> {
  return (
    (await apiJson<Report[]>(`/api/reports${all ? "?all=true" : ""}`).catch(
      () => null,
    )) ?? []
  );
}

export function resolveReport(id: string) {
  return api.request(`/api/reports/${id}/resolve`, { method: "POST" });
}

export function deleteReport(id: string) {
  return api.request(`/api/reports/${id}`, { method: "DELETE" });
}

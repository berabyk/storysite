/**
 * Planning workspace model + persistence.
 *
 * For now the board is stored locally (per user) in localStorage so the
 * feature works without a round-trip to the API. The load/save functions are
 * the single seam to swap for server-side persistence later (e.g. a
 * `/api/plan` endpoint) without touching the UI.
 */

export type PlanNodeKind = "concept" | "note" | "text";
export type PlanPlace = "board" | "notebook";

export interface PlanNode {
  id: string;
  kind: PlanNodeKind;
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
  /** Sticky-note fill colour. */
  color?: string;
  /** Small rotation (deg) for a hand-placed sticky feel. */
  rot?: number;
  /** Where the sticky note lives: the map board or the notebook rail. */
  place?: PlanPlace;
}

export interface PlanEdge {
  id: string;
  from: string;
  to: string;
}

export interface PlanBoard {
  nodes: PlanNode[];
  edges: PlanEdge[];
  notebook: string;
  updatedAt?: string;
}

export const NOTE_COLORS = [
  "#fde68a",
  "#fbcfe8",
  "#bbf7d0",
  "#bfdbfe",
  "#fed7aa",
  "#ddd6fe",
] as const;

export const emptyBoard = (): PlanBoard => ({
  nodes: [],
  edges: [],
  notebook: "",
});

export const planUid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const storageKey = (userId: string) => `ss_plan_${userId}`;

export function loadBoard(userId: string): PlanBoard {
  if (typeof localStorage === "undefined") return emptyBoard();
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return emptyBoard();
    const parsed = JSON.parse(raw) as Partial<PlanBoard>;
    return {
      nodes: parsed.nodes ?? [],
      edges: parsed.edges ?? [],
      notebook: parsed.notebook ?? "",
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return emptyBoard();
  }
}

export function saveBoard(userId: string, board: PlanBoard): void {
  if (typeof localStorage === "undefined") return;
  try {
    const payload: PlanBoard = {
      ...board,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(storageKey(userId), JSON.stringify(payload));
  } catch {
    // storage full / unavailable — ignore silently
  }
}

import * as React from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Crosshair,
  Link2,
  Loader2,
  NotebookPen,
  Plus,
  StickyNote,
  Trash2,
  Type,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useLocale } from "@/lib/hooks";
import {
  loadBoard,
  saveBoard,
  planUid,
  NOTE_COLORS,
  type PlanBoard,
  type PlanNode,
  type PlanNodeKind,
} from "@/lib/planning";

const NOTE_TEXT = "#3a2f22";

const L = {
  tr: {
    title: "Planlama",
    subtitle: "Kavram haritası, taslak defteri ve yapışkan notlar bir arada.",
    storyTitle: "Hikâye planı",
    storySubtitle: "Bu hikâyeye özel kavram haritası, taslak ve notlar.",
    storySubtitleNamed: "hikâyesine özel plan.",
    backToStories: "Hikâyelerim",
    concept: "Kavram",
    note: "Yapışkan not",
    text: "Metin",
    connect: "Bağla",
    connectHint: "Bağlamak için önce bir kavramı, sonra diğerini seç.",
    notebook: "Taslak defteri",
    center: "Ortala",
    delete: "Sil",
    color: "Renk",
    hint: "Taşımak için sürükle · yazmak için çift tıkla · boş alanı sürükleyerek kaydır",
    notebookPlaceholder: "Hikâyenin taslağını buraya yaz…",
    notebookNotes: "Defter notları",
    addNote: "Not ekle",
    emptyBoard: "Bir kavram ya da not ekleyerek başla.",
    conceptText: "Yeni kavram",
    noteText: "Not…",
    textText: "Metin…",
  },
  en: {
    title: "Planning",
    subtitle: "Concept map, draft notebook and sticky notes in one place.",
    storyTitle: "Story plan",
    storySubtitle: "Concept map, draft and notes dedicated to this story.",
    storySubtitleNamed: "— dedicated plan.",
    backToStories: "My stories",
    concept: "Concept",
    note: "Sticky note",
    text: "Text",
    connect: "Connect",
    connectHint: "To connect, pick one concept then another.",
    notebook: "Draft notebook",
    center: "Recenter",
    delete: "Delete",
    color: "Colour",
    hint: "Drag to move · double-click to type · drag empty space to pan",
    notebookPlaceholder: "Draft your story here…",
    notebookNotes: "Notebook notes",
    addNote: "Add note",
    emptyBoard: "Add a concept or note to begin.",
    conceptText: "New concept",
    noteText: "Note…",
    textText: "Text…",
  },
} as const;

const DEFAULTS: Record<PlanNodeKind, { w: number; h: number }> = {
  concept: { w: 180, h: 84 },
  note: { w: 160, h: 160 },
  text: { w: 200, h: 48 },
};

type Gesture =
  | { kind: "pan"; sx: number; sy: number; ox: number; oy: number }
  | { kind: "move"; id: string; sx: number; sy: number; nx: number; ny: number };

export function PlanningPage() {
  const locale = useLocale();
  const t = L[locale];
  const { user, loading: authLoading } = useAuth();
  const { storyId } = useParams();
  const routeState = useLocation().state as { title?: string } | null;
  const storyTitle = routeState?.title;

  const [board, setBoard] = React.useState<PlanBoard | null>(null);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState<string | null>(null);
  const [connecting, setConnecting] = React.useState(false);
  const [connectFrom, setConnectFrom] = React.useState<string | null>(null);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const [notebookOpen, setNotebookOpen] = React.useState(false);

  const panRef = React.useRef(pan);
  panRef.current = pan;
  const gestureRef = React.useRef<Gesture | null>(null);
  const viewportRef = React.useRef<HTMLDivElement>(null);

  // Load once we know the user (and reload when the scope/story changes).
  React.useEffect(() => {
    if (user) setBoard(loadBoard(user.id, storyId));
    setSelected(null);
    setEditing(null);
    setPan({ x: 0, y: 0 });
  }, [user, storyId]);

  // Persist on every change (debounced a touch).
  React.useEffect(() => {
    if (!user || !board) return;
    const h = setTimeout(() => saveBoard(user.id, board, storyId), 250);
    return () => clearTimeout(h);
  }, [user, board, storyId]);

  // ---- pointer gestures (declared before any early return: Rules of Hooks) ----
  const onPointerMove = React.useCallback((e: PointerEvent) => {
    const g = gestureRef.current;
    if (!g) return;
    if (g.kind === "pan") {
      setPan({ x: g.ox + (e.clientX - g.sx), y: g.oy + (e.clientY - g.sy) });
    } else {
      const nx = g.nx + (e.clientX - g.sx);
      const ny = g.ny + (e.clientY - g.sy);
      setBoard((b) =>
        b
          ? {
              ...b,
              nodes: b.nodes.map((x) =>
                x.id === g.id ? { ...x, x: nx, y: ny } : x,
              ),
            }
          : b,
      );
    }
  }, []);

  const endGesture = React.useCallback(() => {
    gestureRef.current = null;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", endGesture);
    document.body.style.userSelect = "";
  }, [onPointerMove]);

  // keyboard delete for the selected node
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (editing || !selected) return;
      if (e.key === "Delete") {
        e.preventDefault();
        setBoard((b) =>
          b
            ? {
                ...b,
                nodes: b.nodes.filter((n) => n.id !== selected),
                edges: b.edges.filter(
                  (ed) => ed.from !== selected && ed.to !== selected,
                ),
              }
            : b,
        );
        setSelected(null);
        setEditing(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editing, selected]);

  if (!authLoading && !user) return <Navigate to={`/${locale}/login`} replace />;
  if (!board) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="mx-auto size-6 animate-spin" />
      </div>
    );
  }

  const boardNotes = board.nodes.filter(
    (n) => n.kind === "note" && (n.place ?? "board") === "board",
  );
  const mapNodes = board.nodes.filter(
    (n) => n.kind !== "note" || (n.place ?? "board") === "board",
  );
  const notebookNotes = board.nodes.filter(
    (n) => n.kind === "note" && n.place === "notebook",
  );

  const patch = (updater: (b: PlanBoard) => PlanBoard) =>
    setBoard((b) => (b ? updater(b) : b));

  const setNodes = (fn: (n: PlanNode[]) => PlanNode[]) =>
    patch((b) => ({ ...b, nodes: fn(b.nodes) }));

  function addNode(kind: PlanNodeKind, place: "board" | "notebook" = "board") {
    const { w, h } = DEFAULTS[kind];
    const i = board!.nodes.filter((n) => (n.place ?? "board") === "board").length;
    const node: PlanNode = {
      id: planUid(),
      kind,
      x: place === "board" ? -pan.x + 60 + (i % 4) * 210 : 0,
      y: place === "board" ? -pan.y + 70 + Math.floor(i / 4) * 170 : 0,
      w,
      h,
      text: "",
      color: kind === "note" ? NOTE_COLORS[board!.nodes.length % NOTE_COLORS.length] : undefined,
      rot: kind === "note" ? (board!.nodes.length % 5) - 2 : undefined,
      place: kind === "note" ? place : undefined,
    };
    setNodes((n) => [...n, node]);
    setSelected(node.id);
    setEditing(node.id);
  }

  function updateNode(id: string, p: Partial<PlanNode>) {
    setNodes((n) => n.map((x) => (x.id === id ? { ...x, ...p } : x)));
  }

  function removeNode(id: string) {
    patch((b) => ({
      ...b,
      nodes: b.nodes.filter((n) => n.id !== id),
      edges: b.edges.filter((e) => e.from !== id && e.to !== id),
    }));
    setSelected(null);
    setEditing(null);
  }

  function onNodeClickConnect(id: string) {
    if (!connectFrom) {
      setConnectFrom(id);
      return;
    }
    if (connectFrom !== id) {
      patch((b) =>
        b.edges.some(
          (e) =>
            (e.from === connectFrom && e.to === id) ||
            (e.from === id && e.to === connectFrom),
        )
          ? b
          : { ...b, edges: [...b.edges, { id: planUid(), from: connectFrom, to: id }] },
      );
    }
    setConnectFrom(null);
  }

  const startGesture = (g: Gesture) => {
    gestureRef.current = g;
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", endGesture);
  };

  function onBoardPointerDown(e: React.PointerEvent) {
    if (e.target !== e.currentTarget) return;
    setSelected(null);
    setEditing(null);
    startGesture({
      kind: "pan",
      sx: e.clientX,
      sy: e.clientY,
      ox: panRef.current.x,
      oy: panRef.current.y,
    });
  }

  function onNodePointerDown(e: React.PointerEvent, node: PlanNode) {
    if (editing === node.id) return;
    e.stopPropagation();
    setSelected(node.id);
    if (connecting) {
      onNodeClickConnect(node.id);
      return;
    }
    startGesture({
      kind: "move",
      id: node.id,
      sx: e.clientX,
      sy: e.clientY,
      nx: node.x,
      ny: node.y,
    });
  }

  const center = (n: PlanNode) => ({ x: n.x + n.w / 2, y: n.y + n.h / 2 });

  // Point on a node's rectangle border along the direction toward (tx, ty),
  // so connector arrows stop at the edge instead of the node's centre.
  const borderPoint = (n: PlanNode, tx: number, ty: number) => {
    const cx = n.x + n.w / 2;
    const cy = n.y + n.h / 2;
    const dx = tx - cx;
    const dy = ty - cy;
    if (dx === 0 && dy === 0) return { x: cx, y: cy };
    const s = 1 / Math.max(Math.abs(dx) / (n.w / 2), Math.abs(dy) / (n.h / 2));
    return { x: cx + dx * s, y: cy + dy * s };
  };
  const nodeById = (id: string) => board.nodes.find((n) => n.id === id);
  const selNode = selected ? nodeById(selected) : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-4">
        {storyId && (
          <Link
            to={`/${locale}/mine`}
            className="text-muted-foreground hover:text-foreground mb-2 inline-flex items-center gap-1.5 text-sm"
          >
            <ArrowLeft className="size-4" />
            {t.backToStories}
          </Link>
        )}
        <h1 className="font-serif text-3xl font-semibold">
          {storyId ? t.storyTitle : t.title}
        </h1>
        <p className="text-muted-foreground text-sm">
          {storyId
            ? storyTitle
              ? `“${storyTitle}” ${t.storySubtitleNamed}`
              : t.storySubtitle
            : t.subtitle}
        </p>
      </div>

      {/* Toolbar */}
      <div className="bg-card/70 mb-3 flex flex-wrap items-center gap-1.5 rounded-lg border p-2">
        <Tool icon={<Plus className="size-4" />} label={t.concept} onClick={() => addNode("concept")} />
        <Tool icon={<StickyNote className="size-4" />} label={t.note} onClick={() => addNode("note")} />
        <Tool icon={<Type className="size-4" />} label={t.text} onClick={() => addNode("text")} />
        <span className="bg-border mx-1 h-6 w-px" />
        <button
          type="button"
          onClick={() => {
            setConnecting((v) => !v);
            setConnectFrom(null);
          }}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors",
            connecting ? "bg-primary text-primary-foreground" : "hover:bg-accent",
          )}
        >
          <Link2 className="size-4" />
          {t.connect}
        </button>
        <Tool icon={<Crosshair className="size-4" />} label={t.center} onClick={() => setPan({ x: 0, y: 0 })} />
        <span className="bg-border mx-1 h-6 w-px" />

        {/* contextual: selected note colour + delete */}
        {selNode?.kind === "note" && (
          <span className="flex items-center gap-1">
            {NOTE_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => updateNode(selNode.id, { color: c })}
                className={cn(
                  "size-5 rounded-full border transition",
                  selNode.color === c ? "ring-primary ring-2 ring-offset-1" : "",
                )}
                style={{ background: c }}
                aria-label={t.color}
              />
            ))}
          </span>
        )}
        {selNode && (
          <Tool
            icon={<Trash2 className="text-destructive size-4" />}
            label={t.delete}
            onClick={() => removeNode(selNode.id)}
          />
        )}

        <button
          type="button"
          onClick={() => setNotebookOpen((v) => !v)}
          className={cn(
            "ml-auto flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
            notebookOpen ? "bg-primary text-primary-foreground" : "hover:bg-accent",
          )}
        >
          <NotebookPen className="size-4" />
          {t.notebook}
        </button>
      </div>

      <p className="text-muted-foreground mb-2 text-xs">
        {connecting ? t.connectHint : t.hint}
      </p>

      <div className="relative flex gap-3">
        {/* Board */}
        <div
          ref={viewportRef}
          onPointerDown={onBoardPointerDown}
          className={cn(
            "bg-muted/30 relative flex-1 overflow-hidden rounded-xl border",
            "h-[68vh] min-h-[460px]",
          )}
          style={{
            backgroundImage:
              "radial-gradient(color-mix(in oklch, var(--color-foreground) 12%, transparent) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
            backgroundPosition: `${pan.x}px ${pan.y}px`,
            cursor: gestureRef.current?.kind === "pan" ? "grabbing" : "default",
            touchAction: "none",
          }}
        >
          {board.nodes.length === 0 && (
            <div className="text-muted-foreground pointer-events-none absolute inset-0 flex items-center justify-center text-sm">
              {t.emptyBoard}
            </div>
          )}

          <div
            className="absolute left-0 top-0"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}
          >
            {/* edges */}
            <svg
              className="pointer-events-none absolute left-0 top-0 overflow-visible"
              width={1}
              height={1}
            >
              <defs>
                <marker
                  id="plan-arrow"
                  markerWidth="10"
                  markerHeight="10"
                  refX="8"
                  refY="3"
                  orient="auto"
                >
                  <path d="M0,0 L8,3 L0,6 Z" fill="var(--color-primary)" />
                </marker>
              </defs>
              {board.edges.map((e) => {
                const a = nodeById(e.from);
                const b = nodeById(e.to);
                if (!a || !b) return null;
                const ca = center(a);
                const cb = center(b);
                // Clip both ends to the node borders so the line/arrow never
                // crosses over a node's content (e.g. transparent text nodes).
                const p1 = borderPoint(a, cb.x, cb.y);
                const p2 = borderPoint(b, ca.x, ca.y);
                // Pull the arrow tip a few px off the target's edge.
                const ux = ca.x - cb.x;
                const uy = ca.y - cb.y;
                const ul = Math.hypot(ux, uy) || 1;
                const ex = p2.x + (ux / ul) * 5;
                const ey = p2.y + (uy / ul) * 5;
                return (
                  <line
                    key={e.id}
                    x1={p1.x}
                    y1={p1.y}
                    x2={ex}
                    y2={ey}
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    strokeOpacity={0.7}
                    markerEnd="url(#plan-arrow)"
                  />
                );
              })}
            </svg>

            {/* map nodes (concept / text / board notes) */}
            {mapNodes.map((n) => (
              <BoardNode
                key={n.id}
                node={n}
                selected={selected === n.id}
                connectSource={connectFrom === n.id}
                editing={editing === n.id}
                connecting={connecting}
                placeholder={
                  n.kind === "note"
                    ? t.noteText
                    : n.kind === "text"
                      ? t.textText
                      : t.conceptText
                }
                onPointerDown={(e) => onNodePointerDown(e, n)}
                onDoubleClick={() => {
                  setSelected(n.id);
                  setEditing(n.id);
                }}
                onText={(text) => updateNode(n.id, { text })}
                onBlur={() => setEditing(null)}
              />
            ))}
          </div>
        </div>

        {/* Notebook panel */}
        {notebookOpen && (
          <div className="bg-card flex w-full max-w-sm flex-col rounded-xl border p-3 sm:w-80">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-serif text-lg font-semibold">{t.notebook}</h2>
              <button
                type="button"
                onClick={() => setNotebookOpen(false)}
                className="hover:bg-accent rounded-md p-1"
                aria-label="close"
              >
                <X className="size-4" />
              </button>
            </div>
            <textarea
              value={board.notebook}
              onChange={(e) => patch((b) => ({ ...b, notebook: e.target.value }))}
              placeholder={t.notebookPlaceholder}
              className="border-input bg-background/60 font-serif min-h-[38vh] w-full flex-1 resize-y rounded-md border p-3 text-[15px] leading-relaxed outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
            />

            <div className="mt-3 flex items-center justify-between">
              <span className="text-muted-foreground text-xs">{t.notebookNotes}</span>
              <button
                type="button"
                onClick={() => addNode("note", "notebook")}
                className="hover:bg-accent flex items-center gap-1 rounded-md px-2 py-1 text-xs"
              >
                <Plus className="size-3.5" />
                {t.addNote}
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {notebookNotes.map((n) => (
                <div
                  key={n.id}
                  className="relative"
                  style={{
                    width: 96,
                    height: 96,
                    background: n.color,
                    color: NOTE_TEXT,
                    borderRadius: 6,
                    boxShadow: "0 2px 8px -3px rgb(0 0 0 / 0.4)",
                  }}
                >
                  <textarea
                    value={n.text}
                    placeholder={t.noteText}
                    onChange={(e) => updateNode(n.id, { text: e.target.value })}
                    className="size-full resize-none border-0 bg-transparent p-2 text-xs outline-none"
                    style={{ color: NOTE_TEXT }}
                  />
                  <button
                    type="button"
                    onClick={() => removeNode(n.id)}
                    className="absolute -right-1.5 -top-1.5 rounded-full bg-white/90 p-0.5 shadow"
                    aria-label={t.delete}
                  >
                    <X className="size-3" style={{ color: NOTE_TEXT }} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Tool({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="hover:bg-accent flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors"
    >
      {icon}
      {label}
    </button>
  );
}

interface BoardNodeProps {
  node: PlanNode;
  selected: boolean;
  connectSource: boolean;
  editing: boolean;
  connecting: boolean;
  placeholder: string;
  onPointerDown: (e: React.PointerEvent) => void;
  onDoubleClick: () => void;
  onText: (t: string) => void;
  onBlur: () => void;
}

function BoardNode({
  node: n,
  selected,
  connectSource,
  editing,
  connecting,
  placeholder,
  onPointerDown,
  onDoubleClick,
  onText,
  onBlur,
}: BoardNodeProps) {
  const isNote = n.kind === "note";
  const isConcept = n.kind === "concept";

  const base: React.CSSProperties = {
    position: "absolute",
    left: n.x,
    top: n.y,
    width: n.w,
    height: n.h,
    zIndex: selected ? 20 : 10,
    cursor: connecting ? "crosshair" : editing ? "text" : "move",
    outline: selected
      ? "2px solid var(--color-primary)"
      : connectSource
        ? "2px dashed var(--color-primary)"
        : "none",
    outlineOffset: 3,
    transform: isNote && n.rot ? `rotate(${n.rot}deg)` : undefined,
  };

  const skin: React.CSSProperties = isNote
    ? {
        background: n.color,
        color: NOTE_TEXT,
        borderRadius: 6,
        boxShadow: "0 6px 18px -8px rgb(0 0 0 / 0.5)",
      }
    : isConcept
      ? {
          background: "var(--color-card)",
          borderLeft: "4px solid var(--color-primary)",
          border: "1px solid var(--color-border)",
          borderLeftWidth: 4,
          borderRadius: 10,
          boxShadow: "0 6px 18px -12px rgb(0 0 0 / 0.5)",
        }
      : { background: "transparent" };

  const textStyle: React.CSSProperties = {
    fontFamily: isConcept ? "var(--font-serif)" : "var(--font-sans)",
    fontSize: isConcept ? 16 : isNote ? 13 : 15,
    fontWeight: isConcept ? 600 : 400,
    color: isNote ? NOTE_TEXT : "var(--color-foreground)",
    lineHeight: 1.4,
    whiteSpace: "pre-wrap",
    overflowWrap: "break-word",
    wordBreak: "break-word",
  };

  return (
    <div
      style={{ ...base, ...skin }}
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
    >
      {editing ? (
        <textarea
          autoFocus
          value={n.text}
          placeholder={placeholder}
          onChange={(e) => onText(e.target.value)}
          onBlur={onBlur}
          onKeyDown={(e) => {
            if (e.key === "Escape") onBlur();
            e.stopPropagation();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="size-full resize-none border-0 bg-transparent outline-none"
          style={{ ...textStyle, padding: isNote ? 12 : isConcept ? 12 : 6 }}
        />
      ) : (
        <div
          className="flex size-full items-center overflow-hidden"
          style={{ ...textStyle, padding: isNote ? 12 : isConcept ? 12 : 6 }}
        >
          {n.text || (
            <span style={{ opacity: 0.45 }}>{placeholder}</span>
          )}
        </div>
      )}
    </div>
  );
}

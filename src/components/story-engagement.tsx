import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Bookmark, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import { likeStory, recordView, unlikeStory } from "@/lib/engagement";
import { useAuth } from "@/lib/auth";
import { useLocale } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import type { Story } from "@/lib/types";

export function StoryEngagement({ story }: { story: Story }) {
  const { user } = useAuth();
  const locale = useLocale();
  const navigate = useNavigate();

  const [views, setViews] = React.useState(story.viewCount ?? 0);
  const [saves, setSaves] = React.useState(story.likeCount ?? 0);
  const [saved, setSaved] = React.useState(story.likedByMe ?? false);
  const [busy, setBusy] = React.useState(false);

  // Count a view once per mount (server de-duplicates per user/day).
  React.useEffect(() => {
    recordView(story.id)
      .then((r) => setViews(r.viewCount))
      .catch(() => {});
  }, [story.id]);

  async function toggle() {
    if (!user) {
      navigate(`/${locale}/login`);
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      const r = saved ? await unlikeStory(story.id) : await likeStory(story.id);
      setSaved(r.liked);
      setSaves(r.likeCount);
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center justify-center gap-3">
      <span className="text-muted-foreground inline-flex items-center gap-1.5 text-sm">
        <Eye className="size-4" /> {views}
      </span>
      <Button
        variant={saved ? "default" : "outline"}
        size="sm"
        onClick={toggle}
        disabled={busy}
        aria-pressed={saved}
      >
        <Bookmark className={cn("size-4", saved && "fill-current")} />
        {saved
          ? locale === "tr"
            ? "Kaydedildi"
            : "Saved"
          : locale === "tr"
            ? "Kaydet"
            : "Save"}
        <span className="opacity-70">· {saves}</span>
      </Button>
    </div>
  );
}

import * as React from "react";
import { Link, Navigate } from "react-router-dom";
import { Bookmark, Eye, NotebookPen, Pencil, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  deleteStory,
  getMyStories,
  publishStory,
  StoryStatus,
  unpublishStory,
  type MyStory,
} from "@/lib/author";
import { useAuth } from "@/lib/auth";
import { useLocale } from "@/lib/hooks";

const T = {
  tr: {
    title: "Hikâyelerim",
    new: "Yeni hikâye",
    draft: "Taslak",
    published: "Yayında",
    edit: "Düzenle",
    plan: "Planla",
    publish: "Yayınla",
    unpublish: "Yayından al",
    del: "Sil",
    empty: "Henüz hikâyen yok. İlkini oluştur!",
    confirmDel: "Bu hikâyeyi silmek istediğine emin misin?",
  },
  en: {
    title: "My stories",
    new: "New story",
    draft: "Draft",
    published: "Published",
    edit: "Edit",
    plan: "Plan",
    publish: "Publish",
    unpublish: "Unpublish",
    del: "Delete",
    empty: "No stories yet. Create your first one!",
    confirmDel: "Delete this story?",
  },
} as const;

export function MyStoriesPage() {
  const locale = useLocale();
  const t = T[locale];
  const { user, loading: authLoading } = useAuth();

  const [stories, setStories] = React.useState<MyStory[] | null>(null);

  const load = React.useCallback(() => {
    getMyStories()
      .then(setStories)
      .catch(() => setStories([]));
  }, []);

  React.useEffect(() => {
    if (user) load();
  }, [user, load]);

  if (!authLoading && !user) return <Navigate to={`/${locale}/login`} replace />;

  async function toggle(s: MyStory) {
    if (s.status === StoryStatus.Published) await unpublishStory(s.id);
    else await publishStory(s.id);
    load();
  }

  async function onDelete(s: MyStory) {
    if (!confirm(t.confirmDel)) return;
    await deleteStory(s.id);
    load();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-serif text-3xl font-semibold sm:text-4xl">
          {t.title}
        </h1>
        <Button asChild>
          <Link to={`/${locale}/new`}>
            <Plus /> {t.new}
          </Link>
        </Button>
      </div>

      {stories === null ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : stories.length === 0 ? (
        <p className="text-muted-foreground py-16 text-center">{t.empty}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {stories.map((s) => {
            const published = s.status === StoryStatus.Published;
            return (
              <Card key={s.id} className="flex-row items-center gap-4 p-4">
                {s.coverImageUrl && (
                  <img
                    src={s.coverImageUrl}
                    alt=""
                    className="hidden h-14 w-20 rounded-md object-cover sm:block"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-serif text-lg font-semibold">
                      {published ? (
                        <Link to={`/${locale}/stories/${s.slug}`} className="hover:text-primary">
                          {s.title}
                        </Link>
                      ) : (
                        s.title
                      )}
                    </h3>
                    <Badge variant={published ? "soft" : "secondary"}>
                      {published ? t.published : t.draft}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground mt-1 flex items-center gap-4 text-xs">
                    <span className="inline-flex items-center gap-1">
                      <Eye className="size-3.5" /> {s.viewCount}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Bookmark className="size-3.5" /> {s.likeCount}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button asChild variant="ghost" size="icon" title={t.edit}>
                    <Link to={`/${locale}/edit/${s.slug}`}>
                      <Pencil className="size-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" size="icon" title={t.plan}>
                    <Link
                      to={`/${locale}/plan/${s.id}`}
                      state={{ title: s.title }}
                    >
                      <NotebookPen className="size-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toggle(s)}>
                    {published ? t.unpublish : t.publish}
                  </Button>
                  <Button variant="ghost" size="icon" title={t.del} onClick={() => onDelete(s)}>
                    <Trash2 className="text-destructive size-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

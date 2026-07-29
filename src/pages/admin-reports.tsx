import * as React from "react";
import { Link, Navigate } from "react-router-dom";
import { Check, Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  deleteReport,
  listReports,
  resolveReport,
  type Report,
} from "@/lib/moderation";
import { isAdmin } from "@/lib/characters";
import { useAuth } from "@/lib/auth";
import { useLocale } from "@/lib/hooks";
import { formatDate } from "@/lib/utils";

const T = {
  tr: {
    title: "Raporlar",
    subtitle: "Kullanıcıların uygunsuz bulduğu içerikler.",
    empty: "Bekleyen rapor yok.",
    resolve: "Çözüldü",
    del: "Sil",
    view: "Hikâyeyi gör",
  },
  en: {
    title: "Reports",
    subtitle: "Content users flagged as inappropriate.",
    empty: "No pending reports.",
    resolve: "Resolve",
    del: "Delete",
    view: "View story",
  },
} as const;

export function AdminReportsPage() {
  const locale = useLocale();
  const t = T[locale];
  const { user, loading: authLoading } = useAuth();
  const [rows, setRows] = React.useState<Report[] | null>(null);

  const reload = React.useCallback(() => {
    listReports().then(setRows);
  }, []);

  React.useEffect(() => {
    if (user && isAdmin(user.roles)) reload();
  }, [user, reload]);

  if (!authLoading && (!user || !isAdmin(user.roles)))
    return <Navigate to={`/${locale}`} replace />;

  async function onResolve(id: string) {
    await resolveReport(id);
    reload();
  }
  async function onDelete(id: string) {
    await deleteReport(id);
    reload();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-serif text-3xl font-semibold sm:text-4xl">{t.title}</h1>
      <p className="text-muted-foreground mb-8 text-sm">{t.subtitle}</p>

      {rows === null ? (
        <div className="py-16 text-center">
          <Loader2 className="mx-auto size-6 animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground py-16 text-center">{t.empty}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((r) => (
            <Card key={r.id} className="flex-row items-start gap-4 p-4">
              <div className="min-w-0 flex-1">
                <Link
                  to={`/${locale}/stories/${r.storySlug}`}
                  className="font-serif text-lg font-semibold hover:text-primary"
                >
                  {r.storyTitle || r.storySlug}
                </Link>
                <p className="mt-1 break-words text-sm">{r.reason}</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {formatDate(r.createdAt, locale)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onResolve(r.id)}
                  title={t.resolve}
                >
                  <Check className="size-4" /> {t.resolve}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title={t.del}
                  onClick={() => onDelete(r.id)}
                >
                  <Trash2 className="text-destructive size-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

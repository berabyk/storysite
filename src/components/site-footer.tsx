import { BookOpen, Heart } from "lucide-react";

import { useDict, useLocale } from "@/lib/hooks";
import { Link } from "react-router-dom";

export function SiteFooter() {
  const dict = useDict();
  const locale = useLocale();
  const year = new Date().getFullYear();

  return (
    <footer className="border-border/60 mt-24 border-t">
      <div className="text-muted-foreground mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 py-10 text-sm sm:flex-row sm:justify-between sm:px-6">
        <Link
          to={`/${locale}`}
          className="text-foreground flex items-center gap-2 font-serif text-base font-semibold"
        >
          <BookOpen className="text-primary size-4" />
          {dict.siteName}
        </Link>
        <p className="flex items-center gap-1.5 text-center">
          {dict.footer.builtWith}
        </p>
        <p className="flex items-center gap-1.5">
          © {year} · <Heart className="text-primary size-3.5 fill-current" />
        </p>
      </div>
    </footer>
  );
}

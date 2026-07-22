import { Home } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { DEFAULT_LOCALE } from "@/lib/i18n";

export function NotFoundPage() {
  return (
    <div className="bg-paper flex min-h-svh flex-col items-center justify-center px-4 text-center">
      <p className="text-primary font-serif text-7xl font-semibold">404</p>
      <h1 className="font-serif mt-4 text-2xl font-semibold">
        Bu sayfa kayıp bir hikâye
      </h1>
      <p className="text-muted-foreground mt-2">
        Aradığın sayfa bulunamadı.
      </p>
      <Button asChild className="mt-8">
        <Link to={`/${DEFAULT_LOCALE}`}>
          <Home /> Ana sayfa
        </Link>
      </Button>
    </div>
  );
}

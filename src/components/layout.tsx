import * as React from "react";
import { Navigate, Outlet, useLocation, useParams } from "react-router-dom";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n";

export function Layout() {
  const { lang } = useParams();
  const { pathname } = useLocation();
  const viewportRef = React.useRef<HTMLDivElement>(null);

  // Reset the scroll position (of the ScrollArea viewport) on navigation.
  React.useEffect(() => {
    viewportRef.current?.scrollTo({
      top: 0,
      behavior: "instant" as ScrollBehavior,
    });
  }, [pathname]);

  // Guard: unknown locale segment → fall back to the default locale.
  if (!isLocale(lang)) {
    return <Navigate to={`/${DEFAULT_LOCALE}`} replace />;
  }

  return (
    <div className="bg-paper flex h-svh flex-col overflow-hidden">
      <SiteHeader />
      <ScrollArea className="flex-1" viewportRef={viewportRef}>
        <main>
          <Outlet />
        </main>
        <SiteFooter />
      </ScrollArea>
    </div>
  );
}

import * as React from "react";
import { Navigate, Outlet, useLocation, useParams } from "react-router-dom";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { blockFontFamily } from "@/components/canvas-view";
import { useActiveUniverse } from "@/lib/universe-theme";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n";

export function Layout() {
  const { lang } = useParams();
  const { pathname } = useLocation();
  const { active } = useActiveUniverse();
  const theme = active?.theme ?? null;
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

  // A universe can theme the whole page (background, text, accent, font).
  const themeStyle = theme
    ? ({
        ...(theme.background ? { ["--background" as string]: theme.background } : {}),
        ...(theme.textColor ? { ["--foreground" as string]: theme.textColor } : {}),
        ...(theme.accent ? { ["--primary" as string]: theme.accent } : {}),
        ...(theme.font
          ? { ["--font-sans" as string]: blockFontFamily(theme.font) }
          : {}),
        ...(theme.backgroundImage
          ? {
              backgroundImage: `url(${JSON.stringify(theme.backgroundImage)})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }
          : {}),
      } as React.CSSProperties)
    : undefined;

  return (
    <div
      className="bg-paper flex h-svh flex-col overflow-hidden"
      style={themeStyle}
    >
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

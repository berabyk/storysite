import {
  BookOpen,
  Flag,
  Globe,
  Library,
  LogIn,
  LogOut,
  Menu,
  NotebookPen,
  Plus,
  Shield,
  User,
} from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModeToggle } from "@/components/mode-toggle";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useDict, useLocale } from "@/lib/hooks";
import { LOCALES } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

const LOCALE_LABELS: Record<Locale, string> = { tr: "Türkçe", en: "English" };

export function SiteHeader() {
  const locale = useLocale();
  const dict = useDict();
  const location = useLocation();
  const { user, logout } = useAuth();

  const links = [
    { to: `/${locale}`, label: dict.nav.stories, end: true },
    { to: `/${locale}/characters`, label: dict.nav.characters, end: false },
  ];

  // Swap the locale segment of the current path, keeping the rest.
  const pathForLocale = (next: Locale) => {
    const rest = location.pathname.replace(/^\/(tr|en)/, "");
    return `/${next}${rest}`;
  };

  return (
    <header className="border-border/60 bg-background/80 sticky top-0 z-40 w-full border-b backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-4 sm:px-6">
        <Link
          to={`/${locale}`}
          className="group flex items-center gap-2.5"
          aria-label={dict.siteName}
        >
          <span className="bg-primary/12 text-primary flex size-9 items-center justify-center rounded-lg transition-colors group-hover:bg-primary/20">
            <BookOpen className="size-5" />
          </span>
          <span className="font-serif text-xl font-semibold tracking-tight">
            {dict.siteName}
          </span>
        </Link>

        <nav className="ml-2 hidden items-center gap-1 sm:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          {/* Language */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Dil / Language">
                <Globe className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {LOCALES.map((l) => (
                <DropdownMenuItem key={l} asChild>
                  <Link
                    to={pathForLocale(l)}
                    className={cn(l === locale && "text-primary font-medium")}
                  >
                    {LOCALE_LABELS[l]}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <ModeToggle />

          {/* Auth */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={user.displayName}>
                  <User className="size-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-44">
                <div className="px-2 py-1.5">
                  <div className="text-sm font-medium">{user.displayName}</div>
                  <div className="text-muted-foreground text-xs">@{user.userName}</div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to={`/${locale}/mine`}>
                    <Library className="size-4" />
                    {locale === "tr" ? "Hikâyelerim" : "My stories"}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={`/${locale}/new`}>
                    <Plus className="size-4" />
                    {locale === "tr" ? "Yeni hikâye" : "New story"}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={`/${locale}/plan`}>
                    <NotebookPen className="size-4" />
                    {locale === "tr" ? "Planlama" : "Planning"}
                  </Link>
                </DropdownMenuItem>
                {user.roles?.includes("Admin") && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to={`/${locale}/admin/characters`}>
                        <Shield className="size-4" />
                        {locale === "tr" ? "Karakter yönetimi" : "Manage characters"}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={`/${locale}/admin/reports`}>
                        <Flag className="size-4" />
                        {locale === "tr" ? "Raporlar" : "Reports"}
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => logout()}>
                  <LogOut className="size-4" />
                  {locale === "tr" ? "Çıkış yap" : "Sign out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="ghost" size="icon" aria-label={locale === "tr" ? "Giriş" : "Sign in"}>
              <Link to={`/${locale}/login`}>
                <LogIn className="size-5" />
              </Link>
            </Button>
          )}

          {/* Mobile nav */}
          <div className="sm:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Menü">
                  <Menu className="size-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {links.map((link) => (
                  <DropdownMenuItem key={link.to} asChild>
                    <Link to={link.to}>{link.label}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}

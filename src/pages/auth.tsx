import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { useLocale } from "@/lib/hooks";
import type { Locale } from "@/lib/types";

const T: Record<Locale, Record<string, string>> = {
  tr: {
    loginTitle: "Giriş yap",
    registerTitle: "Hesap oluştur",
    email: "E-posta",
    emailOrUser: "E-posta veya kullanıcı adı",
    userName: "Kullanıcı adı",
    displayName: "Görünen ad",
    password: "Parola",
    loginCta: "Giriş yap",
    registerCta: "Kayıt ol",
    haveAccount: "Zaten hesabın var mı?",
    noAccount: "Hesabın yok mu?",
    loginLink: "Giriş yap",
    registerLink: "Kayıt ol",
    optional: "(isteğe bağlı)",
  },
  en: {
    loginTitle: "Sign in",
    registerTitle: "Create account",
    email: "Email",
    emailOrUser: "Email or username",
    userName: "Username",
    displayName: "Display name",
    password: "Password",
    loginCta: "Sign in",
    registerCta: "Sign up",
    haveAccount: "Already have an account?",
    noAccount: "No account yet?",
    loginLink: "Sign in",
    registerLink: "Sign up",
    optional: "(optional)",
  },
};

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const locale = useLocale();
  const t = T[locale];
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    emailOrUserName: "",
    email: "",
    userName: "",
    displayName: "",
    password: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await login(form.emailOrUserName, form.password);
      } else {
        await register({
          email: form.email,
          userName: form.userName,
          password: form.password,
          displayName: form.displayName || undefined,
        });
      }
      navigate(`/${locale}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16 sm:px-6">
      <h1 className="font-serif mb-6 text-center text-3xl font-semibold">
        {mode === "login" ? t.loginTitle : t.registerTitle}
      </h1>

      <Card className="p-6">
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {mode === "login" ? (
            <Field label={t.emailOrUser}>
              <Input value={form.emailOrUserName} onChange={set("emailOrUserName")} autoComplete="username" required />
            </Field>
          ) : (
            <>
              <Field label={t.email}>
                <Input type="email" value={form.email} onChange={set("email")} autoComplete="email" required />
              </Field>
              <Field label={t.userName}>
                <Input value={form.userName} onChange={set("userName")} autoComplete="username" required minLength={3} />
              </Field>
              <Field label={`${t.displayName} ${t.optional}`}>
                <Input value={form.displayName} onChange={set("displayName")} />
              </Field>
            </>
          )}

          <Field label={t.password}>
            <Input
              type="password"
              value={form.password}
              onChange={set("password")}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              minLength={6}
            />
          </Field>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <Button type="submit" disabled={loading} className="mt-2">
            {loading && <Loader2 className="size-4 animate-spin" />}
            {mode === "login" ? t.loginCta : t.registerCta}
          </Button>
        </form>
      </Card>

      <p className="text-muted-foreground mt-6 text-center text-sm">
        {mode === "login" ? t.noAccount : t.haveAccount}{" "}
        <Link
          to={`/${locale}/${mode === "login" ? "register" : "login"}`}
          className="text-primary font-medium hover:underline"
        >
          {mode === "login" ? t.registerLink : t.loginLink}
        </Link>
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </label>
  );
}

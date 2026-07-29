import * as React from "react";
import { Link, Navigate } from "react-router-dom";
import { BookOpen, Loader2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { uploadImage } from "@/lib/author";
import { useAuth } from "@/lib/auth";
import { useLocale } from "@/lib/hooks";

const T = {
  tr: {
    title: "Profilim",
    displayName: "Görünen ad",
    bio: "Hakkında",
    bioPh: "Kendinden kısaca bahset…",
    avatar: "Profil görseli",
    upload: "Görsel yükle",
    save: "Kaydet",
    saved: "Kaydedildi",
    myStories: "Hikâyelerim",
    publicPage: "Herkese açık sayfam",
  },
  en: {
    title: "My profile",
    displayName: "Display name",
    bio: "About",
    bioPh: "A few words about you…",
    avatar: "Avatar",
    upload: "Upload image",
    save: "Save",
    saved: "Saved",
    myStories: "My stories",
    publicPage: "My public page",
  },
} as const;

export function ProfilePage() {
  const locale = useLocale();
  const t = T[locale];
  const { user, loading: authLoading, updateProfile } = useAuth();

  const [displayName, setDisplayName] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (user) {
      setDisplayName(user.displayName ?? "");
      setBio(user.bio ?? "");
      setAvatarUrl(user.avatarUrl ?? null);
    }
  }, [user]);

  if (!authLoading && !user) return <Navigate to={`/${locale}/login`} replace />;
  if (!user) return null;

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      setAvatarUrl(await uploadImage(file));
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setBusy(true);
    setSaved(false);
    setError(null);
    try {
      await updateProfile({ displayName: displayName.trim(), bio, avatarUrl });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kaydedilemedi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="font-serif text-3xl font-semibold sm:text-4xl">
          {t.title}
        </h1>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to={`/${locale}/author/${user.userName}`}>{t.publicPage}</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to={`/${locale}/mine`}>
              <BookOpen className="size-4" /> {t.myStories}
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="size-20 rounded-full object-cover"
            />
          ) : (
            <div className="bg-muted flex size-20 items-center justify-center rounded-full text-2xl font-semibold">
              {(displayName || user.userName).charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label>{t.avatar}</Label>
            <Button asChild variant="outline" size="sm">
              <label className="cursor-pointer">
                {uploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}
                {t.upload}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onUpload}
                />
              </label>
            </Button>
          </div>
        </div>

        <label className="flex flex-col gap-1.5">
          <Label>{t.displayName}</Label>
          <Input
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value);
              setSaved(false);
            }}
          />
          <span className="text-muted-foreground text-xs">@{user.userName}</span>
        </label>

        <label className="flex flex-col gap-1.5">
          <Label>{t.bio}</Label>
          <Textarea
            value={bio}
            placeholder={t.bioPh}
            className="min-h-24"
            onChange={(e) => {
              setBio(e.target.value);
              setSaved(false);
            }}
          />
        </label>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <div>
          <Button onClick={save} disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            {saved ? t.saved : t.save}
          </Button>
        </div>
      </div>
    </div>
  );
}

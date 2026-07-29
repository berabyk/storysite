import { Navigate, Route, Routes } from "react-router-dom";

import { Layout } from "@/components/layout";
import { HomePage } from "@/pages/home";
import { StoryPage } from "@/pages/story";
import { CharactersPage } from "@/pages/characters";
import { CharacterPage } from "@/pages/character";
import { AuthPage } from "@/pages/auth";
import { StoryEditorPage } from "@/pages/story-editor";
import { MyStoriesPage } from "@/pages/my-stories";
import { PlanningPage } from "@/pages/planning";
import { AdminCharactersPage } from "@/pages/admin-characters";
import { NotFoundPage } from "@/pages/not-found";
import { DEFAULT_LOCALE } from "@/lib/i18n";

export default function App() {
  return (
    <Routes>
      <Route index element={<Navigate to={`/${DEFAULT_LOCALE}`} replace />} />
      <Route path=":lang" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="stories/:slug" element={<StoryPage />} />
        <Route path="characters" element={<CharactersPage />} />
        <Route path="characters/:slug" element={<CharacterPage />} />
        <Route path="login" element={<AuthPage mode="login" />} />
        <Route path="register" element={<AuthPage mode="register" />} />
        <Route path="mine" element={<MyStoriesPage />} />
        <Route path="plan" element={<PlanningPage />} />
        <Route path="plan/:storyId" element={<PlanningPage />} />
        <Route path="admin/characters" element={<AdminCharactersPage />} />
        <Route path="new" element={<StoryEditorPage />} />
        <Route path="edit/:slug" element={<StoryEditorPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

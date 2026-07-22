import { Navigate, Route, Routes } from "react-router-dom";

import { Layout } from "@/components/layout";
import { HomePage } from "@/pages/home";
import { StoryPage } from "@/pages/story";
import { CharactersPage } from "@/pages/characters";
import { CharacterPage } from "@/pages/character";
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
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

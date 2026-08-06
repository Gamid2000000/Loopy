import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { ProtectedRoute } from "../components/routing/ProtectedRoute";
import { PublicOnlyRoute } from "../components/routing/PublicOnlyRoute";
import { DashboardPage } from "../pages/DashboardPage";
import { LoginPage } from "../pages/LoginPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { RegisterPage } from "../pages/RegisterPage";
import { StatisticsPage } from "../pages/StatisticsPage";
import { DecksPage } from "../pages/DecksPage";
import { DeckDetailsPage } from "../pages/DeckDetailsPage";
import { CardsPage } from "../pages/CardsPage";
import { CardImportPage } from "../pages/CardImportPage";
import { StudySessionPage } from "../pages/StudySessionPage";
import { StudyEntryPage } from "../pages/StudyEntryPage";
import { ProfilePage } from "../pages/ProfilePage";
import { LandingPage } from "../pages/LandingPage";
import { ForumPage } from "../pages/ForumPage";
import { ForumCategoryPage } from "../pages/ForumCategoryPage";
import { ForumTopicPage } from "../pages/ForumTopicPage";
import { CreateForumTopicPage } from "../pages/CreateForumTopicPage";
import { useAuth } from "../context/AuthContext/useAuth";
import { RouteLoader } from "../components/routing/RouteLoader";
const shell = (page: React.ReactNode) => <AppShell>{page}</AppShell>;
function ForumCreateRoute() {
  const { status } = useAuth(); const location = useLocation();
  if (status === "unknown") return <RouteLoader />;
  return status === "authenticated" ? <CreateForumTopicPage /> : <Navigate to="/login" replace state={{ returnTo: `${location.pathname}${location.search}` }} />;
}
export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/forum" element={<ForumPage />} />
      <Route path="/forum/categories/:categorySlug" element={<ForumCategoryPage />} />
      <Route path="/forum/categories/:categorySlug/new" element={<ForumCreateRoute />} />
      <Route path="/forum/topics/:topicId" element={<ForumTopicPage />} />
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={shell(<DashboardPage />)} />
        <Route path="/decks" element={shell(<DecksPage />)} />
        <Route path="/decks/:deckId" element={shell(<DeckDetailsPage />)} />
        <Route path="/decks/:deckId/cards" element={shell(<CardsPage />)} />
        <Route path="/decks/:deckId/cards/import" element={shell(<CardImportPage />)} />
        <Route path="/study" element={shell(<StudyEntryPage />)} />
        <Route path="/study-sessions/:sessionId" element={<StudySessionPage />} />
        <Route path="/statistics" element={shell(<StatisticsPage />)} />
        <Route path="/profile" element={shell(<ProfilePage />)} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

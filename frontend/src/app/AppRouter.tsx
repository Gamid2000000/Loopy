import { Route, Routes } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { ProtectedRoute } from "../components/routing/ProtectedRoute";
import { PublicOnlyRoute } from "../components/routing/PublicOnlyRoute";
import { DashboardPage } from "../pages/DashboardPage";
import { LoginPage } from "../pages/LoginPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { RegisterPage } from "../pages/RegisterPage";
import { ComingSoonPage } from "../pages/ComingSoonPage";
import { DecksPage } from "../pages/DecksPage";
import { DeckDetailsPage } from "../pages/DeckDetailsPage";
import { CardsPage } from "../pages/CardsPage";
import { StudySessionPage } from "../pages/StudySessionPage";
import { StudyEntryPage } from "../pages/StudyEntryPage";
const shell=(page:React.ReactNode)=><AppShell>{page}</AppShell>;
export function AppRouter(){return <Routes><Route element={<PublicOnlyRoute/>}><Route path="/login" element={<LoginPage/>}/><Route path="/register" element={<RegisterPage/>}/></Route><Route element={<ProtectedRoute/>}><Route path="/dashboard" element={shell(<DashboardPage/>)}/><Route path="/decks" element={shell(<DecksPage/>)}/><Route path="/decks/:deckId" element={shell(<DeckDetailsPage/>)}/><Route path="/decks/:deckId/cards" element={shell(<CardsPage/>)}/><Route path="/study" element={shell(<StudyEntryPage/>)}/><Route path="/study-sessions/:sessionId" element={<StudySessionPage/>}/><Route path="/statistics" element={shell(<ComingSoonPage/>)}/><Route path="/profile" element={shell(<ComingSoonPage/>)}/></Route><Route path="*" element={<NotFoundPage/>}/></Routes>}

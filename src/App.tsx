import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Layout from "@/components/orbit/Layout";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Gallery = lazy(() => import("@/pages/Gallery"));
const ArtDetail = lazy(() => import("@/pages/ArtDetail"));
const UploadArtwork = lazy(() => import("@/pages/UploadArtwork"));
const Collections = lazy(() => import("@/pages/Collections"));
const CollectionDetail = lazy(() => import("@/pages/CollectionDetail"));
const Codex = lazy(() => import("@/pages/Codex"));
const CodexDetail = lazy(() => import("@/pages/CodexDetail"));
const Stories = lazy(() => import("@/pages/Stories"));
const StoryDetail = lazy(() => import("@/pages/StoryDetail"));
const Timeline = lazy(() => import("@/pages/Timeline"));
const Mindmap = lazy(() => import("@/pages/Mindmap"));
const Exports = lazy(() => import("@/pages/Exports"));
const Favorites = lazy(() => import("@/pages/Favorites"));
const Settings = lazy(() => import("@/pages/Settings"));
const Auth = lazy(() => import("@/pages/Auth"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const About = lazy(() => import("@/pages/About"));
const SharedCollection = lazy(() => import("@/pages/SharedCollection"));
const AskArchive = lazy(() => import("@/pages/AskArchive"));

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

const SuspenseFallback = () => (
  <div className="flex-1 flex items-center justify-center min-h-[50vh]">
    <div className="h-6 w-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <BrowserRouter>
          <Suspense fallback={<SuspenseFallback />}>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/gallery/:id" element={<ArtDetail />} />
                <Route path="/upload" element={<ProtectedRoute><UploadArtwork /></ProtectedRoute>} />
                <Route path="/collections" element={<Collections />} />
                <Route path="/collections/:id" element={<CollectionDetail />} />
                <Route path="/codex" element={<Codex />} />
                <Route path="/codex/:id" element={<CodexDetail />} />
                <Route path="/stories" element={<Stories />} />
                <Route path="/stories/:id" element={<StoryDetail />} />
                <Route path="/timeline" element={<Timeline />} />
                <Route path="/mindmap" element={<Mindmap />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/exports" element={<Exports />} />
                <Route path="/settings" element={<Settings />} />
              <Route path="/about" element={<About />} />
              <Route path="/ask" element={<ProtectedRoute><AskArchive /></ProtectedRoute>} />
              </Route>
              <Route path="/share/collection/:id" element={<SharedCollection />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

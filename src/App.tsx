import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Layout from "@/components/orbit/Layout";
import Dashboard from "@/pages/Dashboard";
import Gallery from "@/pages/Gallery";
import ArtDetail from "@/pages/ArtDetail";
import UploadArtwork from "@/pages/UploadArtwork";
import Collections from "@/pages/Collections";
import CollectionDetail from "@/pages/CollectionDetail";
import Codex from "@/pages/Codex";
import CodexDetail from "@/pages/CodexDetail";
import Stories from "@/pages/Stories";
import StoryDetail from "@/pages/StoryDetail";
import Timeline from "@/pages/Timeline";
import Mindmap from "@/pages/Mindmap";
import Exports from "@/pages/Exports";
import ComingSoon from "@/pages/ComingSoon";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
              <Route path="/exports" element={<Exports />} />
              <Route path="/settings" element={<ComingSoon title="Settings" description="Configure your workspace preferences, themes, and integrations. Coming soon." />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

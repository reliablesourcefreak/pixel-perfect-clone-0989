import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/orbit/Layout";
import Dashboard from "@/pages/Dashboard";
import Collections from "@/pages/Collections";
import CollectionDetail from "@/pages/CollectionDetail";
import Codex from "@/pages/Codex";
import CodexDetail from "@/pages/CodexDetail";
import Stories from "@/pages/Stories";
import StoryDetail from "@/pages/StoryDetail";
import Timeline from "@/pages/Timeline";
import ComingSoon from "@/pages/ComingSoon";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/collections/:id" element={<CollectionDetail />} />
            <Route path="/codex" element={<Codex />} />
            <Route path="/codex/:id" element={<CodexDetail />} />
            <Route path="/stories" element={<Stories />} />
            <Route path="/stories/:id" element={<StoryDetail />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/mindmap" element={<ComingSoon title="Mindmap" description="Visual relationship graph connecting your artworks, codex entries, and stories. Coming soon." />} />
            <Route path="/exports" element={<ComingSoon title="Exports" description="Package and deploy your creative work as web galleries, PDF portfolios, and more. Coming soon." />} />
            <Route path="/settings" element={<ComingSoon title="Settings" description="Configure your workspace preferences, themes, and integrations. Coming soon." />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

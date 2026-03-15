import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Outlet, useLocation } from "react-router-dom";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/collections": "Collections",
  "/codex": "Codex",
  "/stories": "Stories",
  "/timeline": "Timeline",
  "/mindmap": "Mindmap",
  "/exports": "Exports",
  "/settings": "Settings",
};

export default function Layout() {
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);

  const getTitle = () => {
    if (location.pathname.startsWith("/collections/")) return "Collection";
    if (location.pathname.startsWith("/codex/")) return "Codex Entry";
    if (location.pathname.startsWith("/stories/")) return "Story";
    return pageTitles[location.pathname] || "Orbit";
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b px-4 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <h2 className="font-display text-lg font-semibold text-foreground">
                {getTitle()}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {searchOpen ? (
                <Input
                  placeholder="Search workspace…"
                  className="w-64 h-8 text-sm animate-scale-in"
                  autoFocus
                  onBlur={() => setSearchOpen(false)}
                />
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  onClick={() => setSearchOpen(true)}
                >
                  <Search className="h-4 w-4" />
                </Button>
              )}
              <Button size="sm" className="h-8 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">New</span>
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Outlet } from "react-router-dom";
import { Search, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function Layout() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center justify-between border-b border-border px-6 bg-background sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground">
                <Menu className="h-4 w-4" strokeWidth={1.5} />
              </SidebarTrigger>
              <span className="catalog-num hidden sm:block">
                Museum Archive — Digital Catalogue System
              </span>
            </div>
            <div className="flex items-center">
              {searchOpen ? (
                <Input
                  placeholder="Search archive…"
                  className="w-56 h-7 text-xs font-mono rounded-none border-foreground animate-fade-up"
                  autoFocus
                  onBlur={() => setSearchOpen(false)}
                />
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Search className="h-4 w-4" strokeWidth={1.5} />
                </button>
              )}
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

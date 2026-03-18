import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { CommandPalette } from "./CommandPalette";

export default function Layout() {
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
                Art Archive — Digital Catalogue
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
                className="hidden sm:flex items-center gap-2 font-mono text-[10px] text-muted-foreground hover:text-foreground border border-border px-2.5 py-1 tracking-wide transition-colors"
              >
                Search <kbd className="text-[9px] px-1 bg-secondary border border-border">⌘K</kbd>
              </button>
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
      <CommandPalette />
    </SidebarProvider>
  );
}

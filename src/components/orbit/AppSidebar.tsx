import {
  LayoutDashboard,
  Image,
  FolderOpen,
  BookOpen,
  BookText,
  Clock,
  Network,
  Download,
  Settings,
  Upload,
  LogIn,
  LogOut,
  Star,
  Info,
  Sparkles,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const mainNav = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Gallery", url: "/gallery", icon: Image },
  { title: "Favorites", url: "/favorites", icon: Star },
  { title: "Collections", url: "/collections", icon: FolderOpen },
  { title: "Codex", url: "/codex", icon: BookOpen },
  { title: "Stories", url: "/stories", icon: BookText },
];

const viewsNav = [
  { title: "Ask Archive", url: "/ask", icon: Sparkles },
  { title: "Timeline", url: "/timeline", icon: Clock },
  { title: "Mindmap", url: "/mindmap", icon: Network },
  { title: "About", url: "/about", icon: Info },
  { title: "Exports", url: "/exports", icon: Download },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="px-5 py-6 border-b border-border">
        {!collapsed ? (
          <div>
            <h1 className="font-serif text-xl tracking-tight text-sidebar-primary">Atelier</h1>
            <p className="catalog-num mt-0.5">Creative Archive</p>
          </div>
        ) : (
          <span className="font-serif text-lg text-sidebar-primary text-center block">A</span>
        )}
      </SidebarHeader>

      <SidebarContent className="px-2 pt-4">
        <SidebarGroup>
          <SidebarGroupLabel className="section-label px-3 pb-2">Catalogue</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="rounded-none font-mono text-xs tracking-wide transition-colors"
                      activeClassName="bg-secondary text-foreground border-l-2 border-foreground"
                    >
                      <item.icon className="mr-2.5 h-3.5 w-3.5" strokeWidth={1.5} />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mx-3 my-4 border-t border-border" />

        <SidebarGroup>
          <SidebarGroupLabel className="section-label px-3 pb-2">Views</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {viewsNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      className="rounded-none font-mono text-xs tracking-wide transition-colors"
                      activeClassName="bg-secondary text-foreground border-l-2 border-foreground"
                    >
                      <item.icon className="mr-2.5 h-3.5 w-3.5" strokeWidth={1.5} />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border">
        <SidebarMenu>
          {user && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink
                  to="/upload"
                  className="rounded-none font-mono text-xs tracking-wide"
                  activeClassName="bg-secondary text-foreground"
                >
                  <Upload className="mr-2.5 h-3.5 w-3.5" strokeWidth={1.5} />
                  {!collapsed && <span>Upload</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            {user ? (
              <SidebarMenuButton
                onClick={async () => { await signOut(); navigate("/"); }}
                className="rounded-none font-mono text-xs tracking-wide"
              >
                <LogOut className="mr-2.5 h-3.5 w-3.5" strokeWidth={1.5} />
                {!collapsed && <span>Logout</span>}
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton asChild>
                <NavLink
                  to="/auth"
                  className="rounded-none font-mono text-xs tracking-wide"
                  activeClassName="bg-secondary text-foreground"
                >
                  <LogIn className="mr-2.5 h-3.5 w-3.5" strokeWidth={1.5} />
                  {!collapsed && <span>Sign In</span>}
                </NavLink>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

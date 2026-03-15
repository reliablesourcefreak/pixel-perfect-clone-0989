import {
  LayoutDashboard,
  FolderOpen,
  BookOpen,
  BookText,
  Clock,
  Network,
  Download,
  Settings,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
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
  { title: "Index", url: "/", icon: LayoutDashboard },
  { title: "Collections", url: "/collections", icon: FolderOpen },
  { title: "Codex", url: "/codex", icon: BookOpen },
  { title: "Stories", url: "/stories", icon: BookText },
];

const viewsNav = [
  { title: "Timeline", url: "/timeline", icon: Clock },
  { title: "Mindmap", url: "/mindmap", icon: Network },
  { title: "Exports", url: "/exports", icon: Download },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/";
    return currentPath.startsWith(path);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="px-5 py-6 border-b border-border">
        {!collapsed ? (
          <div>
            <h1 className="font-serif text-xl tracking-tight text-sidebar-primary">Orbit</h1>
            <p className="catalog-num mt-0.5">Archive No. 001</p>
          </div>
        ) : (
          <span className="font-serif text-lg text-sidebar-primary text-center block">O</span>
        )}
      </SidebarHeader>

      <SidebarContent className="px-2 pt-4">
        <SidebarGroup>
          <SidebarGroupLabel className="section-label px-3 pb-2">
            Catalogue
          </SidebarGroupLabel>
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
          <SidebarGroupLabel className="section-label px-3 pb-2">
            Views
          </SidebarGroupLabel>
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
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/settings")}>
              <NavLink
                to="/settings"
                className="rounded-none font-mono text-xs tracking-wide"
                activeClassName="bg-secondary text-foreground"
              >
                <Settings className="mr-2.5 h-3.5 w-3.5" strokeWidth={1.5} />
                {!collapsed && <span>Settings</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

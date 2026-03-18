import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { LogOut, Trash2, Moon, Sun } from "lucide-react";

export default function Settings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));

  const toggleTheme = (checked: boolean) => {
    setDark(checked);
    if (checked) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const clearLocalData = () => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith("orbit_"));
    keys.forEach(k => localStorage.removeItem(k));
    toast({ title: "Cleared", description: `Removed ${keys.length} local data entries.` });
  };

  const rssUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rss-feed`;

  return (
    <div className="px-8 py-10 max-w-3xl mx-auto">
      <div className="mb-10">
        <span className="catalog-num">Configuration</span>
        <h1 className="font-serif text-3xl mt-2 text-foreground">Settings</h1>
      </div>

      <div className="border-t border-accent border-2 mb-8" />

      <div className="space-y-0 border border-border divide-y divide-border">
        {/* Account */}
        <div className="p-6">
          <h3 className="font-serif text-lg text-foreground mb-4">Account</h3>
          <div className="space-y-4">
            <div>
              <Label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Email</Label>
              <p className="font-mono text-sm text-foreground mt-1">{user?.email || "Not signed in"}</p>
            </div>
            <div>
              <Label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">User ID</Label>
              <p className="font-mono text-[10px] text-muted-foreground mt-1 break-all">{user?.id || "—"}</p>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="p-6">
          <h3 className="font-serif text-lg text-foreground mb-4">Appearance</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {dark ? <Moon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} /> : <Sun className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />}
              <div>
                <p className="font-mono text-xs text-foreground">Dark Mode</p>
                <p className="font-mono text-[10px] text-muted-foreground tracking-wide mt-0.5">Switch between light and dark themes</p>
              </div>
            </div>
            <Switch checked={dark} onCheckedChange={toggleTheme} />
          </div>
        </div>

        {/* Integrations */}
        <div className="p-6">
          <h3 className="font-serif text-lg text-foreground mb-4">Integrations</h3>
          <div>
            <Label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">RSS Feed URL</Label>
            <div className="mt-2 flex items-center gap-2">
              <code className="font-mono text-[10px] text-foreground bg-secondary px-2 py-1.5 border border-border flex-1 truncate">
                {rssUrl}
              </code>
              <Button
                variant="outline"
                size="sm"
                className="font-mono text-[10px] tracking-wide shrink-0"
                onClick={() => {
                  navigator.clipboard.writeText(rssUrl);
                  toast({ title: "Copied", description: "RSS URL copied." });
                }}
              >
                Copy
              </Button>
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="p-6">
          <h3 className="font-serif text-lg text-foreground mb-4">Keyboard Shortcuts</h3>
          <div className="space-y-2">
            {[
              { keys: "⌘K", desc: "Open command palette" },
            ].map(s => (
              <div key={s.keys} className="flex items-center justify-between">
                <span className="font-mono text-xs text-muted-foreground">{s.desc}</span>
                <kbd className="font-mono text-[10px] px-2 py-0.5 border border-border bg-secondary text-foreground">{s.keys}</kbd>
              </div>
            ))}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="p-6">
          <h3 className="font-serif text-lg text-destructive mb-4">Danger Zone</h3>
          <div className="space-y-3">
            <Button variant="outline" size="sm" className="font-mono text-xs tracking-wide" onClick={clearLocalData}>
              <Trash2 className="h-3 w-3 mr-1.5" strokeWidth={1.5} />
              Clear Local Data
            </Button>
            {user && (
              <Button variant="outline" size="sm" className="font-mono text-xs tracking-wide text-destructive hover:text-destructive" onClick={handleSignOut}>
                <LogOut className="h-3 w-3 mr-1.5" strokeWidth={1.5} />
                Sign Out
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, BookOpen } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { CodexListSkeleton } from "@/components/orbit/GallerySkeletons";

const typeLabels: Record<string, string> = {
  character: "CHAR",
  world: "WRLD",
  concept: "CNPT",
  technique: "TECH",
  reference: "REF",
  other: "MISC",
};

const TYPE_COLORS: Record<string, string> = {
  character: "hsl(350, 65%, 50%)",
  world: "hsl(210, 80%, 55%)",
  concept: "hsl(280, 65%, 55%)",
  technique: "hsl(35, 85%, 55%)",
  reference: "hsl(160, 60%, 45%)",
  other: "hsl(45, 70%, 50%)",
};

interface CodexRow {
  id: string;
  title: string;
  type: string;
  content: string;
  ai_summary: string | null;
  created_at: string;
  updated_at: string;
  artwork_count: number;
}

export default function Codex() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<CodexRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("character");
  const [content, setContent] = useState("");

  const fetchEntries = async () => {
    setLoading(true);
    const { data: rows } = await supabase
      .from("codex_entries")
      .select("*")
      .order("updated_at", { ascending: false });

    if (!rows) { setLoading(false); return; }

    const ids = rows.map(r => r.id);
    const { data: links } = await supabase
      .from("codex_artwork_links")
      .select("codex_entry_id")
      .in("codex_entry_id", ids.length > 0 ? ids : ["_"]);

    const enriched: CodexRow[] = rows.map(r => ({
      ...r,
      artwork_count: (links || []).filter(l => l.codex_entry_id === r.id).length,
    }));

    setEntries(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchEntries(); }, []);

  const handleCreate = async () => {
    if (!user || !title.trim()) return;
    const { error } = await supabase.from("codex_entries").insert({
      user_id: user.id, title: title.trim(), type, content: content.trim(),
    });
    if (error) { toast.error("Error", { description: error.message }); return; }
    setTitle(""); setContent(""); setType("character"); setOpen(false);
    toast("Entry registered");
    fetchEntries();
  };

  const grouped = entries.reduce<Record<string, CodexRow[]>>((acc, e) => {
    (acc[e.type] = acc[e.type] || []).push(e);
    return acc;
  }, {});

  return (
    <div className="px-8 py-10 max-w-6xl mx-auto">
      <div className="flex items-end justify-between mb-8">
        <div>
          <span className="catalog-num">Catalogue Section — Knowledge Base</span>
          <h1 className="font-serif text-3xl mt-2 text-foreground">Codex</h1>
          <p className="font-mono text-xs text-muted-foreground mt-2 tracking-wide">
            {entries.length} registered entries across {Object.keys(grouped).length} categories
          </p>
        </div>
        {user && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="archive" size="sm">
                <Plus className="h-3 w-3 mr-1.5" strokeWidth={1.5} />
                New Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-none border-foreground">
              <DialogHeader>
                <DialogTitle className="font-serif text-xl">Register Codex Entry</DialogTitle>
              </DialogHeader>
              <div className="space-y-5 mt-4">
                <div>
                  <Label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Entry designation" className="mt-1.5 rounded-none" />
                </div>
                <div>
                  <Label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Classification</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="rounded-none mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-none">
                      <SelectItem value="character">Character</SelectItem>
                      <SelectItem value="world">World</SelectItem>
                      <SelectItem value="concept">Concept</SelectItem>
                      <SelectItem value="technique">Technique</SelectItem>
                      <SelectItem value="reference">Reference</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Content</Label>
                  <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Documentation…" rows={6} className="mt-1.5 rounded-none font-mono text-xs" />
                </div>
                <Button onClick={handleCreate} variant="archive" className="w-full">
                  Register Entry
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="border-t border-border mb-10" />

      {loading ? (
        <CodexListSkeleton />
      ) : entries.length === 0 ? (
        <div className="border border-border p-16 text-center space-y-3">
          <BookOpen className="h-8 w-8 text-muted-foreground mx-auto" strokeWidth={1} />
          <p className="font-mono text-xs text-muted-foreground tracking-wide">
            No entries yet. Create one to start building your knowledge base.
          </p>
        </div>
      ) : (
        Object.entries(grouped).map(([typeName, typeEntries]) => (
          <section key={typeName} className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <span className="h-2 w-2" style={{ backgroundColor: TYPE_COLORS[typeName] || "hsl(0,0%,50%)" }} />
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground border border-border px-2 py-0.5">
                {typeLabels[typeName] || "MISC"}
              </span>
              <span className="section-label capitalize">{typeName}s — {typeEntries.length}</span>
            </div>

            <div className="border border-border divide-y divide-border">
              {typeEntries.map((entry, i) => (
                <div
                  key={entry.id}
                  onClick={() => navigate(`/codex/${entry.id}`)}
                  className="cursor-pointer p-5 hover:bg-secondary transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="catalog-num">{typeLabels[entry.type] || "MISC"}-{String(i + 1).padStart(3, "0")}</span>
                        <h4 className="font-serif text-base text-foreground">{entry.title}</h4>
                      </div>
                      {entry.ai_summary ? (
                        <p className="mt-2 font-mono text-xs text-muted-foreground line-clamp-2 leading-relaxed max-w-xl italic">
                          AI: {entry.ai_summary}
                        </p>
                      ) : (
                        <p className="mt-2 font-mono text-xs text-muted-foreground line-clamp-2 leading-relaxed max-w-xl">
                          {entry.content.replace(/[#*\[\]]/g, "").slice(0, 180)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 font-mono text-[10px] text-muted-foreground tracking-wide shrink-0 ml-6">
                      <span>{entry.artwork_count} works</span>
                      <span>{new Date(entry.updated_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Save, Plus, X, Search, Loader2, Sparkles, Wand2 } from "lucide-react";
import RelationshipGraph from "@/components/orbit/RelationshipGraph";
import { toast } from "sonner";
import { archiveConfirm } from "@/components/orbit/ConfirmDialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

interface CodexData {
  id: string;
  title: string;
  type: string;
  content: string;
  ai_summary: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface LinkedArtwork {
  id: string;
  title: string;
  image_url: string;
}

interface AiSuggestion {
  id: string;
  title: string;
  image_url: string;
  reason: string;
}

export default function CodexDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [entry, setEntry] = useState<CodexData | null>(null);
  const [linkedArtworks, setLinkedArtworks] = useState<LinkedArtwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [allArtworks, setAllArtworks] = useState<LinkedArtwork[]>([]);
  const [summarizing, setSummarizing] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    const [{ data: row }, { data: links }] = await Promise.all([
      supabase.from("codex_entries").select("*").eq("id", id).single(),
      supabase.from("codex_artwork_links").select("artwork_id, artworks(id, title, image_url)").eq("codex_entry_id", id),
    ]);
    if (!row) { setLoading(false); return; }
    setEntry(row as CodexData);
    setTitle(row.title);
    setContent(row.content);
    setLinkedArtworks((links || []).map(l => (l as any).artworks).filter(Boolean));
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [id]);

  const isOwner = user?.id === entry?.user_id;

  const handleSave = async () => {
    if (!entry) return;
    await supabase.from("codex_entries").update({ title, content }).eq("id", entry.id);
    setEntry({ ...entry, title, content });
    setEditing(false);
    toast("Entry updated");
  };

  const handleDelete = async () => {
    if (!entry) return;
    const ok = await archiveConfirm({
      title: "Delete this entry?",
      description: "The codex entry and its links to artworks will be removed.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    await supabase.from("codex_entries").delete().eq("id", entry.id);
    toast("Entry deleted");
    navigate("/codex");
  };

  const handleAiSummary = async () => {
    if (!entry || !entry.content.trim()) return;
    setSummarizing(true);
    try {
      const res = await supabase.functions.invoke("analyze-artwork", {
        body: { mode: "codex-summary", title: entry.title, type: entry.type, content: entry.content },
      });
      const summary = res.data?.summary;
      if (summary) {
        await supabase.from("codex_entries").update({ ai_summary: summary }).eq("id", entry.id);
        setEntry({ ...entry, ai_summary: summary });
        toast("AI summary generated");
      }
    } catch {
      toast.error("Could not generate summary");
    }
    setSummarizing(false);
  };

  const handleSuggestConnections = async () => {
    if (!entry || !entry.content.trim()) return;
    setSuggesting(true);
    try {
      const res = await supabase.functions.invoke("analyze-artwork", {
        body: {
          mode: "suggest-connections",
          codex_entry_id: entry.id,
          title: entry.title,
          type: entry.type,
          content: entry.content,
        },
      });
      if (res.error) throw res.error;
      const sug = res.data?.suggestions || [];
      setSuggestions(sug);
      setSuggestOpen(true);
      if (sug.length === 0) toast("No related artworks found");
    } catch {
      toast.error("Could not generate suggestions");
    }
    setSuggesting(false);
  };

  const acceptSuggestion = async (artworkId: string) => {
    if (!id) return;
    if (linkedArtworks.some(a => a.id === artworkId)) { toast("Already linked"); return; }
    const { error } = await supabase.from("codex_artwork_links").insert({ codex_entry_id: id, artwork_id: artworkId });
    if (error) { toast.error("Error", { description: error.message }); return; }
    const added = suggestions.find(s => s.id === artworkId);
    if (added) setLinkedArtworks(prev => [...prev, { id: added.id, title: added.title, image_url: added.image_url }]);
    setSuggestions(prev => prev.filter(s => s.id !== artworkId));
    toast("Artwork linked");
  };

  const openAddDialog = async () => {
    const { data } = await supabase.from("artworks").select("id, title, image_url").order("created_at", { ascending: false });
    setAllArtworks(data || []);
    setAddOpen(true);
  };

  const addArtwork = async (artworkId: string) => {
    if (!id) return;
    if (linkedArtworks.some(a => a.id === artworkId)) { toast("Already linked"); return; }
    const { error } = await supabase.from("codex_artwork_links").insert({ codex_entry_id: id, artwork_id: artworkId });
    if (error) { toast.error("Error", { description: error.message }); return; }
    const added = allArtworks.find(a => a.id === artworkId);
    if (added) setLinkedArtworks(prev => [...prev, added]);
    toast("Artwork linked");
  };

  const removeArtwork = async (artworkId: string) => {
    if (!id) return;
    await supabase.from("codex_artwork_links").delete().eq("codex_entry_id", id).eq("artwork_id", artworkId);
    setLinkedArtworks(prev => prev.filter(a => a.id !== artworkId));
    toast("Artwork unlinked");
  };

  const linkedIds = new Set(linkedArtworks.map(a => a.id));
  const filteredAll = allArtworks.filter(a =>
    !linkedIds.has(a.id) && (!search || a.title.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  if (!entry) return <div className="flex items-center justify-center min-h-[60vh]"><p className="font-mono text-xs text-muted-foreground">Entry not found in archive</p></div>;

  return (
    <div className="px-8 py-10 max-w-4xl mx-auto space-y-10">
      <button onClick={() => navigate("/codex")} className="font-mono text-xs text-muted-foreground hover:text-foreground tracking-widest uppercase transition-colors">
        ← Codex
      </button>

      <div>
        <div className="flex items-center gap-3 mb-2">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground border border-border px-2 py-0.5">
            {entry.type.toUpperCase()}
          </span>
          <span className="catalog-num">{new Date(entry.created_at).toISOString().split("T")[0]}</span>
        </div>

        {editing ? (
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="text-3xl font-serif rounded-none border-b border-t-0 border-l-0 border-r-0 px-0" />
        ) : (
          <h1 className="text-3xl font-serif text-foreground mt-3">{entry.title}</h1>
        )}
      </div>

      {/* AI Summary */}
      {entry.ai_summary && (
        <div className="border border-accent/30 bg-accent/5 p-5">
          <span className="font-mono text-[10px] tracking-widest uppercase text-accent">AI Summary</span>
          <p className="font-mono text-xs text-foreground mt-2 leading-relaxed">{entry.ai_summary}</p>
        </div>
      )}

      {/* Actions */}
      {isOwner && (
        <div className="flex gap-3 flex-wrap">
          {editing ? (
            <Button variant="archive" size="sm" onClick={handleSave}>
              <Save className="h-3 w-3 mr-1.5" strokeWidth={1.5} /> Save
            </Button>
          ) : (
            <Button variant="archive" size="sm" onClick={() => setEditing(true)}>
              Edit Entry
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={openAddDialog} className="font-mono text-xs">
            <Plus className="h-3 w-3 mr-1.5" strokeWidth={1.5} /> Link Artwork
          </Button>
          <Button variant="outline" size="sm" onClick={handleSuggestConnections} disabled={suggesting} className="font-mono text-xs">
            <Wand2 className="h-3 w-3 mr-1.5" strokeWidth={1.5} /> {suggesting ? "Finding…" : "Suggest Connections"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleAiSummary} disabled={summarizing} className="font-mono text-xs">
            <Sparkles className="h-3 w-3 mr-1.5" strokeWidth={1.5} /> {summarizing ? "Analyzing…" : "AI Summary"}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDelete} className="text-destructive hover:text-destructive font-mono text-xs uppercase tracking-widest">
            <Trash2 className="h-3 w-3 mr-1.5" strokeWidth={1.5} /> Remove
          </Button>
        </div>
      )}

      {/* Content */}
      <div className="border border-border p-8">
        {editing ? (
          <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={20} className="font-mono text-xs leading-relaxed rounded-none border-0 resize-none p-0 focus-visible:ring-0" />
        ) : (
          <div className="font-mono text-xs leading-[1.8] text-foreground whitespace-pre-wrap">
            {entry.content}
          </div>
        )}
      </div>

      {/* Linked Artworks */}
      {linkedArtworks.length > 0 && (
        <div>
          <span className="section-label">Linked Specimens — {linkedArtworks.length}</span>
          <div className="border-t border-border mt-2 mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-border border border-border">
            {linkedArtworks.map((art) => (
              <div key={art.id} className="bg-background group relative">
                <div className="aspect-square overflow-hidden cursor-pointer" onClick={() => navigate(`/gallery/${art.id}`)}>
                  <img src={art.image_url} alt={art.title} className="h-full w-full object-cover" loading="lazy" />
                </div>
                <div className="p-3 border-t border-border flex items-center justify-between">
                  <h4 className="font-serif text-xs text-foreground truncate cursor-pointer" onClick={() => navigate(`/gallery/${art.id}`)}>{art.title}</h4>
                  {isOwner && (
                    <button onClick={() => removeArtwork(art.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Relationship Graph */}
      <RelationshipGraph codexEntryId={id || ""} linkedArtworkIds={linkedArtworks.map(a => a.id)} />

      {/* Add artworks dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="rounded-none border-foreground max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Link Artworks</DialogTitle>
          </DialogHeader>
          <div className="relative mt-2">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search artworks…" className="rounded-none pr-8" />
            <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <div className="flex-1 overflow-auto mt-4 border border-border divide-y divide-border">
            {filteredAll.length === 0 ? (
              <div className="p-8 text-center">
                <p className="font-mono text-xs text-muted-foreground tracking-wide">No artworks available to link</p>
              </div>
            ) : filteredAll.map(art => (
              <div key={art.id} className="flex items-center gap-4 p-3 hover:bg-secondary transition-colors">
                <img src={art.image_url} alt="" className="h-12 w-12 object-cover border border-border shrink-0" />
                <span className="font-serif text-sm text-foreground flex-1 truncate">{art.title}</span>
                <Button variant="outline" size="sm" className="font-mono text-xs shrink-0" onClick={() => addArtwork(art.id)}>
                  <Plus className="h-3 w-3 mr-1" /> Link
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Suggestions dialog */}
      <Dialog open={suggestOpen} onOpenChange={setSuggestOpen}>
        <DialogContent className="rounded-none border-foreground max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl flex items-center gap-2">
              <Wand2 className="h-4 w-4" /> AI-Suggested Connections
            </DialogTitle>
          </DialogHeader>
          <p className="font-mono text-xs text-muted-foreground">Artworks the AI thinks are thematically related to this entry.</p>
          <div className="flex-1 overflow-auto mt-4 border border-border divide-y divide-border">
            {suggestions.length === 0 ? (
              <div className="p-8 text-center">
                <p className="font-mono text-xs text-muted-foreground tracking-wide">No suggestions remaining</p>
              </div>
            ) : suggestions.map(sug => (
              <div key={sug.id} className="flex items-start gap-4 p-4 hover:bg-secondary transition-colors">
                <img src={sug.image_url} alt="" className="h-16 w-16 object-cover border border-border shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-serif text-sm text-foreground block truncate">{sug.title}</span>
                  <p className="font-mono text-[11px] text-muted-foreground mt-1 leading-relaxed">{sug.reason}</p>
                </div>
                <Button variant="outline" size="sm" className="font-mono text-xs shrink-0 mt-1" onClick={() => acceptSuggestion(sug.id)}>
                  <Plus className="h-3 w-3 mr-1" /> Link
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

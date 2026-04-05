import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pin, Trash2, Plus, X, Loader2, Search, Share2, Copy } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

interface CollectionData {
  id: string;
  name: string;
  description: string;
  color: string;
  is_pinned: boolean;
  user_id: string;
  created_at: string;
}

interface ArtworkInCollection {
  id: string;
  title: string;
  image_url: string;
  analysis_status: string;
}

export default function CollectionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [collection, setCollection] = useState<CollectionData | null>(null);
  const [artworks, setArtworks] = useState<ArtworkInCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [allArtworks, setAllArtworks] = useState<ArtworkInCollection[]>([]);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    const [{ data: col }, { data: links }] = await Promise.all([
      supabase.from("collections").select("*").eq("id", id).single(),
      supabase.from("collection_artworks").select("artwork_id, artworks(id, title, image_url, analysis_status)").eq("collection_id", id),
    ]);

    if (!col) { setLoading(false); return; }
    setCollection(col as CollectionData);
    setArtworks((links || []).map(l => (l as any).artworks).filter(Boolean));
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [id]);

  const isOwner = user?.id === collection?.user_id;

  const togglePin = async () => {
    if (!collection) return;
    await supabase.from("collections").update({ is_pinned: !collection.is_pinned }).eq("id", collection.id);
    setCollection({ ...collection, is_pinned: !collection.is_pinned });
    toast({ title: collection.is_pinned ? "Unpinned" : "Pinned" });
  };

  const handleDelete = async () => {
    if (!collection || !confirm("Delete this collection? Artworks won't be deleted.")) return;
    await supabase.from("collections").delete().eq("id", collection.id);
    toast({ title: "Collection deleted" });
    navigate("/collections");
  };

  const removeArtwork = async (artworkId: string) => {
    if (!id) return;
    await supabase.from("collection_artworks").delete().eq("collection_id", id).eq("artwork_id", artworkId);
    setArtworks(prev => prev.filter(a => a.id !== artworkId));
    toast({ title: "Removed from collection" });
  };

  const openAddDialog = async () => {
    const { data } = await supabase.from("artworks").select("id, title, image_url, analysis_status").order("created_at", { ascending: false });
    setAllArtworks(data || []);
    setAddOpen(true);
  };

  const addArtwork = async (artworkId: string) => {
    if (!id) return;
    if (artworks.some(a => a.id === artworkId)) { toast({ title: "Already in collection" }); return; }
    const { error } = await supabase.from("collection_artworks").insert({ collection_id: id, artwork_id: artworkId });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    const added = allArtworks.find(a => a.id === artworkId);
    if (added) setArtworks(prev => [...prev, added]);
    toast({ title: "Added to collection" });
  };

  const artworkIds = new Set(artworks.map(a => a.id));
  const filteredAll = allArtworks.filter(a =>
    !artworkIds.has(a.id) && (!search || a.title.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  if (!collection) return <div className="flex items-center justify-center min-h-[60vh]"><p className="font-mono text-xs text-muted-foreground">Collection not found</p></div>;

  return (
    <div className="max-w-6xl mx-auto px-8 py-10 space-y-8">
      <button onClick={() => navigate("/collections")} className="font-mono text-xs text-muted-foreground hover:text-foreground tracking-widest uppercase transition-colors">
        ← Collections
      </button>

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <span className="h-3 w-3" style={{ backgroundColor: collection.color }} />
          <span className="catalog-num">Curated Board</span>
        </div>
        <h1 className="font-serif text-4xl text-foreground">{collection.name}</h1>
        {collection.description && (
          <p className="font-mono text-xs text-muted-foreground mt-3 tracking-wide max-w-xl leading-relaxed">{collection.description}</p>
        )}
      </div>

      {/* Actions */}
      {isOwner && (
        <div className="flex gap-3">
          <Button variant="archive" size="sm" onClick={openAddDialog}>
            <Plus className="h-3 w-3 mr-1.5" strokeWidth={1.5} /> Add Artworks
          </Button>
          <Button variant="outline" size="sm" onClick={togglePin} className="font-mono text-xs">
            <Pin className="h-3 w-3 mr-1.5" strokeWidth={1.5} /> {collection.is_pinned ? "Unpin" : "Pin"}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDelete} className="text-destructive hover:text-destructive font-mono text-xs uppercase tracking-widest">
            <Trash2 className="h-3 w-3 mr-1.5" strokeWidth={1.5} /> Delete
          </Button>
        </div>
      )}

      <div className="border-t border-border" style={{ borderColor: collection.color }} />

      {/* Stats */}
      <div className="border border-border">
        <table className="w-full font-mono text-xs">
          <tbody>
            <tr className="border-b border-border">
              <td className="p-3 text-muted-foreground tracking-widest uppercase w-40">Works</td>
              <td className="p-3 text-foreground">{artworks.length}</td>
            </tr>
            <tr className="border-b border-border">
              <td className="p-3 text-muted-foreground tracking-widest uppercase">Created</td>
              <td className="p-3 text-foreground">{new Date(collection.created_at).toISOString().split("T")[0]}</td>
            </tr>
            <tr>
              <td className="p-3 text-muted-foreground tracking-widest uppercase">Status</td>
              <td className="p-3 text-foreground">{collection.is_pinned ? "PINNED" : "STANDARD"}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Artworks grid */}
      <div>
        <span className="section-label">Board Contents — {artworks.length} Works</span>
        <div className="border-t border-border mt-2 mb-6" />

        {artworks.length === 0 ? (
          <div className="border border-border p-16 text-center">
            <p className="font-mono text-xs text-muted-foreground tracking-wide">
              Empty board. Add artworks from your archive to curate this collection.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-px bg-border border border-border">
            {artworks.map((art) => (
              <div key={art.id} className="bg-background group relative">
                <div className="aspect-square overflow-hidden cursor-pointer" onClick={() => navigate(`/gallery/${art.id}`)}>
                  <img src={art.image_url} alt={art.title} className="h-full w-full object-cover transition-all duration-500" loading="lazy" />
                </div>
                <div className="p-3 border-t border-border flex items-center justify-between">
                  <h4 className="font-serif text-xs text-foreground truncate cursor-pointer" onClick={() => navigate(`/gallery/${art.id}`)}>{art.title}</h4>
                  {isOwner && (
                    <button onClick={() => removeArtwork(art.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive" title="Remove from collection">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add artworks dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="rounded-none border-foreground max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Add Artworks to Board</DialogTitle>
          </DialogHeader>
          <div className="relative mt-2">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search artworks…" className="rounded-none pr-8" />
            <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <div className="flex-1 overflow-auto mt-4 border border-border divide-y divide-border">
            {filteredAll.length === 0 ? (
              <div className="p-8 text-center">
                <p className="font-mono text-xs text-muted-foreground tracking-wide">No artworks available to add</p>
              </div>
            ) : filteredAll.map(art => (
              <div key={art.id} className="flex items-center gap-4 p-3 hover:bg-secondary transition-colors">
                <img src={art.image_url} alt="" className="h-12 w-12 object-cover border border-border shrink-0" />
                <span className="font-serif text-sm text-foreground flex-1 truncate">{art.title}</span>
                <Button variant="outline" size="sm" className="font-mono text-xs shrink-0" onClick={() => addArtwork(art.id)}>
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCw, Trash2, Star, Pencil, Save, X, Plus, FolderPlus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const CATEGORY_COLORS: Record<string, string> = {
  "Digital": "hsl(210, 80%, 55%)", "3D Render": "hsl(280, 65%, 55%)",
  "Concept Art": "hsl(35, 85%, 55%)", "Abstract": "hsl(330, 70%, 55%)",
  "Fantasy": "hsl(160, 60%, 45%)", "Sci-Fi": "hsl(195, 85%, 50%)",
  "Portrait": "hsl(15, 75%, 55%)", "Landscape": "hsl(120, 50%, 45%)",
  "Architecture": "hsl(45, 70%, 50%)", "Character": "hsl(350, 65%, 50%)",
  "Illustration": "hsl(260, 60%, 55%)", "Photography Style": "hsl(80, 50%, 45%)",
};

interface AnalysisData {
  ai_description: string | null;
  composition: string | null;
  technical_details: string | null;
  color_palette: any;
  styles: string[] | null;
  moods: string[] | null;
}

interface ArtworkDetail {
  id: string;
  title: string;
  image_url: string;
  analysis_status: string;
  file_size_bytes: number | null;
  width: number | null;
  height: number | null;
  created_at: string;
  user_id: string;
  is_favorited: boolean;
  analysis: AnalysisData | null;
  categories: { category: string; confidence: number }[];
  tags: string[];
}

export default function ArtDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [artwork, setArtwork] = useState<ArtworkDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [newTag, setNewTag] = useState("");
  const [relatedArtworks, setRelatedArtworks] = useState<{ id: string; title: string; image_url: string; matchScore: number }[]>([]);

  const fetchArtwork = async () => {
    if (!id) return;
    const [{ data: art }, { data: analysis }, { data: cats }, { data: tags }] = await Promise.all([
      supabase.from("artworks").select("*").eq("id", id).single(),
      supabase.from("artwork_analysis").select("*").eq("artwork_id", id).single(),
      supabase.from("artwork_categories").select("category, confidence").eq("artwork_id", id).order("confidence", { ascending: false }),
      supabase.from("artwork_tags").select("tag").eq("artwork_id", id),
    ]);

    if (!art) { setLoading(false); return; }

    const detail: ArtworkDetail = {
      ...art,
      is_favorited: (art as any).is_favorited ?? false,
      analysis: analysis || null,
      categories: (cats || []).map(c => ({ category: c.category, confidence: Number(c.confidence) })),
      tags: (tags || []).map(t => t.tag),
    };
    setArtwork(detail);
    setEditTitle(art.title);

    // Related artworks
    if (tags && tags.length > 0) {
      const tagValues = tags.map(t => t.tag);
      const { data: relatedTags } = await supabase
        .from("artwork_tags").select("artwork_id, tag")
        .in("tag", tagValues.slice(0, 5)).neq("artwork_id", id);

      if (relatedTags) {
        const scoreMap = new Map<string, number>();
        relatedTags.forEach(rt => scoreMap.set(rt.artwork_id, (scoreMap.get(rt.artwork_id) || 0) + 1));
        const relatedIds = Array.from(scoreMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([rid]) => rid);

        if (relatedIds.length > 0) {
          const { data: relArts } = await supabase.from("artworks").select("id, title, image_url").in("id", relatedIds);
          if (relArts) {
            setRelatedArtworks(relArts.map(ra => ({
              ...ra,
              matchScore: Math.round(((scoreMap.get(ra.id) || 0) / tagValues.length) * 100),
            })));
          }
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => { fetchArtwork(); }, [id]);

  const handleReanalyze = async () => {
    if (!artwork) return;
    setReanalyzing(true);
    const { error } = await supabase.functions.invoke("analyze-artwork", {
      body: { artwork_id: artwork.id, image_url: artwork.image_url },
    });
    if (error) toast({ title: "Re-analysis failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Re-analysis complete" }); await fetchArtwork(); }
    setReanalyzing(false);
  };

  const handleDelete = async () => {
    if (!artwork || !confirm("Delete this artwork permanently?")) return;
    await supabase.from("artworks").delete().eq("id", artwork.id);
    toast({ title: "Deleted" });
    navigate("/gallery");
  };

  const toggleFavorite = async () => {
    if (!artwork) return;
    const newVal = !artwork.is_favorited;
    await supabase.from("artworks").update({ is_favorited: newVal } as any).eq("id", artwork.id);
    setArtwork({ ...artwork, is_favorited: newVal });
    toast({ title: newVal ? "Added to favorites" : "Removed from favorites" });
  };

  const saveTitle = async () => {
    if (!artwork || !editTitle.trim()) return;
    await supabase.from("artworks").update({ title: editTitle }).eq("id", artwork.id);
    setArtwork({ ...artwork, title: editTitle });
    setEditing(false);
    toast({ title: "Title updated" });
  };

  const addTag = async () => {
    if (!artwork || !newTag.trim()) return;
    const tag = newTag.trim().toLowerCase();
    if (artwork.tags.includes(tag)) { setNewTag(""); return; }
    await supabase.from("artwork_tags").insert({ artwork_id: artwork.id, tag });
    setArtwork({ ...artwork, tags: [...artwork.tags, tag] });
    setNewTag("");
    toast({ title: "Tag added" });
  };

  const removeTag = async (tag: string) => {
    if (!artwork) return;
    await supabase.from("artwork_tags").delete().eq("artwork_id", artwork.id).eq("tag", tag);
    setArtwork({ ...artwork, tags: artwork.tags.filter(t => t !== tag) });
    toast({ title: "Tag removed" });
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  if (!artwork) return <div className="flex items-center justify-center min-h-[60vh]"><p className="font-mono text-xs text-muted-foreground">Artwork not found</p></div>;

  const a = artwork.analysis;
  const palette: { name: string; hex: string }[] = Array.isArray(a?.color_palette) ? a.color_palette : [];
  const isOwner = user?.id === artwork.user_id;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Top bar */}
      <div className="px-8 py-3 border-b border-border flex items-center justify-between">
        <button onClick={() => navigate("/gallery")} className="font-mono text-xs text-muted-foreground hover:text-foreground tracking-widest uppercase transition-colors">← Gallery</button>
        <div className="flex items-center gap-3">
          {isOwner && (
            <>
              <button onClick={toggleFavorite} className={`transition-colors ${artwork.is_favorited ? "text-accent" : "text-muted-foreground hover:text-foreground"}`} title="Favorite">
                <Star className="h-4 w-4" strokeWidth={1.5} fill={artwork.is_favorited ? "currentColor" : "none"} />
              </button>
              <button onClick={() => setEditing(!editing)} className="font-mono text-xs text-muted-foreground hover:text-foreground tracking-wide flex items-center gap-1 transition-colors">
                <Pencil className="h-3 w-3" strokeWidth={1.5} /> Edit
              </button>
              <button onClick={handleReanalyze} disabled={reanalyzing} className="font-mono text-xs text-muted-foreground hover:text-foreground tracking-wide flex items-center gap-1 transition-colors">
                <RefreshCw className={`h-3 w-3 ${reanalyzing ? "animate-spin" : ""}`} strokeWidth={1.5} /> Re-analyze
              </button>
              <button onClick={handleDelete} className="font-mono text-xs text-accent hover:text-accent/80 tracking-wide flex items-center gap-1 transition-colors">
                <Trash2 className="h-3 w-3" strokeWidth={1.5} /> Delete
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] min-h-[calc(100vh-8rem)]">
        {/* Image */}
        <div className="border-r border-border p-8 flex flex-col items-center justify-start">
          <img src={artwork.image_url} alt={artwork.title} className="max-w-full max-h-[70vh] object-contain" />
          {palette.length > 0 && (
            <div className="w-full mt-4 flex h-6 border border-border">
              {palette.map((c, i) => (
                <div key={i} className="flex-1 relative group/color" style={{ backgroundColor: c.hex }} title={`${c.name} — ${c.hex}`}>
                  <div className="absolute inset-0 flex items-end justify-center opacity-0 group-hover/color:opacity-100 transition-opacity bg-foreground/40 pb-0.5">
                    <span className="font-mono text-[7px] text-primary-foreground tracking-wider uppercase">{c.name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Analysis panel */}
        <div className="p-8 space-y-8 overflow-auto">
          <div>
            <span className="catalog-num">Artwork</span>
            {editing ? (
              <div className="flex items-center gap-2 mt-2">
                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="font-serif text-2xl rounded-none border-b border-t-0 border-l-0 border-r-0 px-0 h-auto" />
                <button onClick={saveTitle} className="text-foreground hover:text-accent transition-colors"><Save className="h-4 w-4" /></button>
                <button onClick={() => { setEditing(false); setEditTitle(artwork.title); }} className="text-muted-foreground hover:text-foreground transition-colors"><X className="h-4 w-4" /></button>
              </div>
            ) : (
              <h1 className="font-serif text-3xl mt-2 text-foreground">
                {artwork.is_favorited && <Star className="inline h-5 w-5 text-accent mr-2" fill="currentColor" strokeWidth={1.5} />}
                {artwork.title}
              </h1>
            )}
            {artwork.analysis_status === "complete" && (
              <div className="flex items-center gap-2 mt-3">
                <span className="h-2.5 w-2.5 bg-accent inline-block" />
                <span className="font-mono text-[10px] tracking-widest uppercase text-accent font-medium">Analysis Complete</span>
              </div>
            )}
          </div>

          <div className="border-t border-border" />

          {a && (
            <>
              {a.ai_description && (
                <section>
                  <h3 className="font-serif text-lg text-foreground mb-3">AI Description</h3>
                  <p className="text-sm text-foreground leading-[1.8]">{a.ai_description}</p>
                </section>
              )}

              {artwork.categories.length > 0 && (
                <section>
                  <h3 className="font-serif text-lg text-foreground mb-3">Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {artwork.categories.map((c) => (
                      <div key={c.category} className="flex items-center gap-2 border border-border px-3 py-1.5">
                        <span className="h-2 w-2 bg-accent inline-block" />
                        <span className="font-mono text-xs text-foreground font-medium">{c.category}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">{c.confidence}%</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Tags — editable */}
              <section>
                <h3 className="font-serif text-lg text-foreground mb-3">Tags</h3>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {artwork.tags.map((tag) => (
                    <span key={tag} className="font-mono text-[10px] tracking-widest uppercase px-2.5 py-1 border border-border text-foreground group/tag flex items-center gap-1.5">
                      {tag}
                      {isOwner && (
                        <button onClick={() => removeTag(tag)} className="opacity-0 group-hover/tag:opacity-100 transition-opacity text-muted-foreground hover:text-destructive">
                          <X className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                {isOwner && (
                  <div className="flex items-center gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add tag…"
                      className="rounded-none h-7 text-xs font-mono w-40"
                      onKeyDown={(e) => e.key === "Enter" && addTag()}
                    />
                    <button onClick={addTag} className="text-muted-foreground hover:text-foreground transition-colors">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </section>

              {a.styles && a.styles.length > 0 && (
                <section>
                  <h3 className="font-serif text-lg text-foreground mb-3">Style</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {a.styles.map((s) => <span key={s} className="font-mono text-xs px-2.5 py-1 bg-secondary text-secondary-foreground">{s}</span>)}
                  </div>
                </section>
              )}

              {a.moods && a.moods.length > 0 && (
                <section>
                  <h3 className="font-serif text-lg text-foreground mb-3">Mood</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {a.moods.map((m) => <span key={m} className="font-mono text-xs px-2.5 py-1 bg-secondary text-secondary-foreground">{m}</span>)}
                  </div>
                </section>
              )}

              <div className="border-t border-border" />

              {a.composition && (
                <section>
                  <h3 className="font-serif text-lg text-foreground mb-3">Composition</h3>
                  <p className="text-sm text-foreground leading-[1.8]">{a.composition}</p>
                </section>
              )}

              {a.technical_details && (
                <section>
                  <h3 className="font-serif text-lg text-foreground mb-3">Technical Details</h3>
                  <p className="text-sm text-foreground leading-[1.8]">{a.technical_details}</p>
                </section>
              )}

              <div className="border-t border-border" />

              <section>
                <div className="border border-border">
                  <table className="w-full font-mono text-[11px]">
                    <tbody>
                      {artwork.width && artwork.height && (
                        <tr className="border-b border-border">
                          <td className="p-2.5 text-muted-foreground tracking-widest uppercase w-32">Dimensions</td>
                          <td className="p-2.5 text-foreground">{artwork.width} × {artwork.height}px</td>
                        </tr>
                      )}
                      {artwork.file_size_bytes && (
                        <tr className="border-b border-border">
                          <td className="p-2.5 text-muted-foreground tracking-widest uppercase">File Size</td>
                          <td className="p-2.5 text-foreground">{(artwork.file_size_bytes / 1024).toFixed(1)} KB</td>
                        </tr>
                      )}
                      <tr>
                        <td className="p-2.5 text-muted-foreground tracking-widest uppercase">Added</td>
                        <td className="p-2.5 text-foreground">{new Date(artwork.created_at).toLocaleDateString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {relatedArtworks.length > 0 && (
            <section>
              <span className="section-label">Related Artworks</span>
              <div className="mt-3 grid grid-cols-2 gap-px bg-border border border-border">
                {relatedArtworks.map((ra) => (
                  <div key={ra.id} onClick={() => navigate(`/gallery/${ra.id}`)} className="cursor-pointer bg-background group">
                    <div className="aspect-square overflow-hidden">
                      <img src={ra.image_url} alt={ra.title} className="h-full w-full object-cover" />
                    </div>
                    <div className="p-2.5 border-t border-border">
                      <p className="font-serif text-xs text-foreground truncate">{ra.title}</p>
                      <span className="font-mono text-[10px] text-muted-foreground">{ra.matchScore}% match</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

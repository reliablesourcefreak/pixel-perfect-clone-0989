import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Pin, FolderOpen, Zap } from "lucide-react";
import { toast } from "sonner";
import { SmartCollectionDialog, SmartRule } from "@/components/orbit/SmartCollectionDialog";

const PALETTE = [
  "hsl(210, 80%, 55%)", "hsl(280, 65%, 55%)", "hsl(35, 85%, 55%)",
  "hsl(160, 60%, 45%)", "hsl(350, 65%, 50%)", "hsl(195, 85%, 50%)",
  "hsl(45, 70%, 50%)", "hsl(120, 50%, 45%)",
];

interface CollectionRow {
  id: string;
  name: string;
  description: string;
  color: string;
  cover_image_url: string | null;
  is_pinned: boolean;
  is_smart: boolean;
  smart_rules: SmartRule | null;
  created_at: string;
  updated_at: string;
  artwork_count: number;
  preview_images: string[];
}

export default function Collections() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [collections, setCollections] = useState<CollectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const fetchCollections = async () => {
    setLoading(true);
    const { data: cols } = await supabase
      .from("collections")
      .select("*")
      .order("is_pinned", { ascending: false })
      .order("updated_at", { ascending: false });

    if (!cols) { setLoading(false); return; }

    const ids = cols.map(c => c.id);
    const { data: links } = await supabase
      .from("collection_artworks")
      .select("collection_id, artwork_id, artworks(image_url)")
      .in("collection_id", ids.length > 0 ? ids : ["_"]);

    const enriched: CollectionRow[] = cols.map(c => {
      const artLinks = (links || []).filter(l => l.collection_id === c.id);
      return {
        ...c,
        smart_rules: c.smart_rules as SmartRule | null,
        artwork_count: artLinks.length,
        preview_images: artLinks.slice(0, 4).map(l => (l as any).artworks?.image_url).filter(Boolean),
      };
    });

    setCollections(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchCollections(); }, []);

  const handleCreate = async (data: { name: string; description: string; is_smart: boolean; smart_rules: SmartRule | null }) => {
    if (!user) return;
    const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    const { error } = await supabase.from("collections").insert({
      user_id: user.id, name: data.name, description: data.description, color,
      is_smart: data.is_smart, smart_rules: data.smart_rules as any,
    });
    if (error) { toast.error("Error", { description: error.message }); return; }
    setOpen(false);
    toast(data.is_smart ? "Smart collection created" : "Collection created");
    fetchCollections();
  };

  return (
    <div className="px-8 py-10 max-w-6xl mx-auto">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <span className="catalog-num">Curated Boards</span>
          <h1 className="font-serif text-3xl mt-2 text-foreground">Collections</h1>
          <p className="font-mono text-xs text-muted-foreground mt-2 tracking-wide max-w-md">
            Organize artworks into curated boards. Unlike the Gallery which shows everything
            with AI-driven filters, Collections are your personal curation — group pieces by
            project, mood, client, or any theme you choose.
          </p>
          <p className="font-mono text-xs text-muted-foreground mt-1 tracking-wide">
            {collections.length} board{collections.length !== 1 ? "s" : ""}
          </p>
        </div>
        {user && (
          <>
            <Button variant="archive" size="sm" onClick={() => setOpen(true)}>
              <Plus className="h-3 w-3 mr-1.5" strokeWidth={1.5} />
              New Board
            </Button>
            <SmartCollectionDialog open={open} onOpenChange={setOpen} onSubmit={handleCreate} />
          </>
        )}
      </div>

      <div className="border-t border-accent mb-8 border-2" />

      {loading ? (
        <div className="border border-border p-16 text-center">
          <p className="font-mono text-xs text-muted-foreground tracking-wide animate-pulse">Loading boards…</p>
        </div>
      ) : collections.length === 0 ? (
        <div className="border border-border p-16 text-center space-y-3">
          <FolderOpen className="h-8 w-8 text-muted-foreground mx-auto" strokeWidth={1} />
          <p className="font-mono text-xs text-muted-foreground tracking-wide">
            No boards yet. Create one to start curating your archive.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {collections.map((col, i) => (
            <div
              key={col.id}
              onClick={() => navigate(`/collections/${col.id}`)}
              className="group cursor-pointer border border-border bg-background hover:bg-secondary transition-colors"
            >
              {/* Preview mosaic */}
              <div className="relative h-48 overflow-hidden">
                {col.preview_images.length > 0 ? (
                  <div className={`h-full w-full grid ${col.preview_images.length >= 4 ? "grid-cols-2 grid-rows-2" : col.preview_images.length >= 2 ? "grid-cols-2" : ""}`}>
                    {col.preview_images.slice(0, 4).map((img, j) => (
                      <img key={j} src={img} alt="" className="h-full w-full object-cover" loading="lazy" />
                    ))}
                  </div>
                ) : (
                  <div className="h-full w-full flex items-center justify-center" style={{ background: `${col.color}15` }}>
                    <FolderOpen className="h-10 w-10" style={{ color: col.color }} strokeWidth={1} />
                  </div>
                )}
                {/* Color accent bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: col.color }} />
              </div>

              <div className="p-5 border-t border-border">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="catalog-num">BRD-{String(i + 1).padStart(3, "0")}</span>
                    <h3 className="font-serif text-lg mt-1 text-foreground">{col.name}</h3>
                  </div>
                  {col.is_pinned && <Pin className="h-3 w-3 text-muted-foreground" strokeWidth={1.5} />}
                </div>
                {col.description && (
                  <p className="font-mono text-[10px] text-muted-foreground mt-2 tracking-wide line-clamp-2">{col.description}</p>
                )}
                <div className="mt-3 flex items-center gap-4 font-mono text-[11px] text-muted-foreground tracking-wide">
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: col.color }} />
                    {col.artwork_count} work{col.artwork_count !== 1 ? "s" : ""}
                  </span>
                  <span className="text-border">|</span>
                  <span>{new Date(col.updated_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

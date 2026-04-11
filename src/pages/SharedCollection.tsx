import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FolderOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ArtworkItem {
  id: string;
  title: string;
  image_url: string;
}

interface CollectionData {
  id: string;
  name: string;
  description: string;
  color: string;
  created_at: string;
}

export default function SharedCollection() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [collection, setCollection] = useState<CollectionData | null>(null);
  const [artworks, setArtworks] = useState<ArtworkItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [{ data: col }, { data: links }] = await Promise.all([
        supabase.from("collections").select("id, name, description, color, created_at").eq("id", id).single(),
        supabase.from("collection_artworks").select("artwork_id, artworks(id, title, image_url)").eq("collection_id", id),
      ]);
      if (col) setCollection(col as CollectionData);
      setArtworks((links || []).map((l: any) => l.artworks).filter(Boolean));
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-8 py-16">
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-4 w-96 mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-px">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="font-mono text-xs text-muted-foreground">Collection not found or has been removed.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-8 py-16">
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-2">
          <span className="h-3 w-3" style={{ backgroundColor: collection.color }} />
          <span className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">Shared Collection</span>
        </div>
        <h1 className="font-serif text-4xl text-foreground">{collection.name}</h1>
        {collection.description && (
          <p className="font-mono text-xs text-muted-foreground mt-3 tracking-wide max-w-xl leading-relaxed">{collection.description}</p>
        )}
        <p className="font-mono text-[10px] text-muted-foreground mt-2 tracking-wide">
          {artworks.length} work{artworks.length !== 1 ? "s" : ""} · Created {new Date(collection.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </p>
      </div>

      <div className="border-t-2 mb-8" style={{ borderColor: collection.color }} />

      {artworks.length === 0 ? (
        <div className="border border-border p-16 text-center">
          <FolderOpen className="h-8 w-8 text-muted-foreground mx-auto mb-3" strokeWidth={1} />
          <p className="font-mono text-xs text-muted-foreground tracking-wide">This collection is empty.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-border border border-border">
          {artworks.map((art) => (
            <div key={art.id} className="bg-background">
              <div className="aspect-square overflow-hidden">
                <img src={art.image_url} alt={art.title} className="h-full w-full object-cover" loading="lazy" />
              </div>
              <div className="p-3 border-t border-border">
                <h4 className="font-serif text-xs text-foreground truncate">{art.title}</h4>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-12 pt-6 border-t border-border text-center">
        <span className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
          Atelier — Creative Archive
        </span>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Star, Loader2 } from "lucide-react";

interface FavArtwork {
  id: string;
  title: string;
  image_url: string;
  created_at: string;
}

export default function Favorites() {
  const navigate = useNavigate();
  const [artworks, setArtworks] = useState<FavArtwork[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("artworks")
        .select("id, title, image_url, created_at")
        .eq("is_favorited", true)
        .order("updated_at", { ascending: false });
      setArtworks(data || []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="px-8 py-10 max-w-6xl mx-auto">
      <div className="mb-10">
        <span className="catalog-num">Personal Collection</span>
        <h1 className="font-serif text-3xl mt-2 text-foreground">Favorites</h1>
        <p className="font-mono text-xs text-muted-foreground mt-2 tracking-wide">
          {artworks.length} starred work{artworks.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="border-t border-accent mb-8 border-2" />

      {loading ? (
        <div className="border border-border p-16 text-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
        </div>
      ) : artworks.length === 0 ? (
        <div className="border border-border p-16 text-center space-y-3">
          <Star className="h-8 w-8 text-muted-foreground mx-auto" strokeWidth={1} />
          <p className="font-mono text-xs text-muted-foreground tracking-wide">
            No favorites yet. Star artworks from the Gallery to see them here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-px bg-border border border-border">
          {artworks.map((art) => (
            <div
              key={art.id}
              onClick={() => navigate(`/gallery/${art.id}`)}
              className="bg-background group cursor-pointer"
            >
              <div className="aspect-square overflow-hidden relative">
                <img src={art.image_url} alt={art.title} className="h-full w-full object-cover transition-all duration-500" loading="lazy" />
                <Star className="absolute top-3 right-3 h-4 w-4 text-yellow-400 fill-yellow-400" />
              </div>
              <div className="p-3 border-t border-border">
                <h4 className="font-serif text-xs text-foreground truncate">{art.title}</h4>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

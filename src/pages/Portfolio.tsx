import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderOpen } from "lucide-react";

interface Profile {
  display_name: string | null;
  bio: string | null;
}

interface PortfolioCollection {
  id: string;
  name: string;
  description: string;
  color: string;
  artworks: { id: string; title: string; image_url: string }[];
}

export default function Portfolio() {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [collections, setCollections] = useState<PortfolioCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      // Check profile exists and portfolio is enabled
      const { data: prof } = await supabase
        .from("profiles")
        .select("display_name, bio, portfolio_enabled")
        .eq("user_id", userId)
        .single();

      if (!prof || !(prof as any).portfolio_enabled) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProfile({ display_name: prof.display_name, bio: prof.bio });

      // Fetch public collections for this user
      const { data: cols } = await supabase
        .from("collections")
        .select("id, name, description, color")
        .eq("user_id", userId)
        .eq("is_public", true)
        .order("is_pinned", { ascending: false })
        .order("updated_at", { ascending: false });

      if (!cols || cols.length === 0) {
        setCollections([]);
        setLoading(false);
        return;
      }

      // Fetch artworks for each collection
      const colIds = cols.map(c => c.id);
      const { data: links } = await supabase
        .from("collection_artworks")
        .select("collection_id, artworks(id, title, image_url)")
        .in("collection_id", colIds);

      const enriched: PortfolioCollection[] = cols.map(c => ({
        ...c,
        artworks: (links || [])
          .filter(l => l.collection_id === c.id)
          .map((l: any) => l.artworks)
          .filter(Boolean),
      }));

      setCollections(enriched);
      setLoading(false);
    })();
  }, [userId]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-8 py-16">
        <Skeleton className="h-10 w-48 mb-4" />
        <Skeleton className="h-4 w-96 mb-12" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-px">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <p className="font-mono text-xs text-muted-foreground tracking-wide">This portfolio does not exist or is not public.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-8 py-16">
          <span className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">Portfolio</span>
          <h1 className="font-serif text-5xl mt-3 text-foreground">
            {profile?.display_name || "Artist"}
          </h1>
          {profile?.bio && (
            <p className="font-mono text-sm text-muted-foreground mt-4 tracking-wide max-w-2xl leading-relaxed">
              {profile.bio}
            </p>
          )}
          <p className="font-mono text-[10px] text-muted-foreground mt-4 tracking-wide">
            {collections.length} collection{collections.length !== 1 ? "s" : ""} ·{" "}
            {collections.reduce((sum, c) => sum + c.artworks.length, 0)} works
          </p>
        </div>
      </header>

      {/* Collections */}
      <main className="max-w-6xl mx-auto px-8 py-12 space-y-16">
        {collections.length === 0 ? (
          <div className="border border-border p-16 text-center">
            <FolderOpen className="h-8 w-8 text-muted-foreground mx-auto mb-3" strokeWidth={1} />
            <p className="font-mono text-xs text-muted-foreground tracking-wide">No public collections yet.</p>
          </div>
        ) : (
          collections.map(col => (
            <section key={col.id}>
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-3 w-3" style={{ backgroundColor: col.color }} />
                  <span className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">Collection</span>
                </div>
                <h2 className="font-serif text-3xl text-foreground">{col.name}</h2>
                {col.description && (
                  <p className="font-mono text-xs text-muted-foreground mt-2 tracking-wide max-w-xl">{col.description}</p>
                )}
              </div>
              <div className="border-t-2 mb-6" style={{ borderColor: col.color }} />
              {col.artworks.length === 0 ? (
                <p className="font-mono text-xs text-muted-foreground tracking-wide">No works in this collection.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px bg-border border border-border">
                  {col.artworks.map(art => (
                    <div key={art.id} className="bg-background">
                      <div className="aspect-square overflow-hidden">
                        <img
                          src={art.image_url}
                          alt={art.title}
                          className="h-full w-full object-cover hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-3 border-t border-border">
                        <h4 className="font-serif text-xs text-foreground truncate">{art.title}</h4>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center">
        <span className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
          Orbit — Creative Archive
        </span>
      </footer>
    </div>
  );
}

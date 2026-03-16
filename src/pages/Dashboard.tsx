import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Image, Upload, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RecentArtwork {
  id: string;
  title: string;
  image_url: string;
  analysis_status: string;
  created_at: string;
}

export default function Dashboard() {
  const [artworks, setArtworks] = useState<RecentArtwork[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetch = async () => {
      const [{ count }, { data }] = await Promise.all([
        supabase.from("artworks").select("*", { count: "exact", head: true }),
        supabase.from("artworks").select("id, title, image_url, analysis_status, created_at").order("created_at", { ascending: false }).limit(8),
      ]);
      setTotalCount(count || 0);
      setArtworks(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="px-10 pt-[100px] pb-16 max-w-6xl mx-auto">
      {/* Title */}
      <div className="mb-16">
        <span className="catalog-num">Overview</span>
        <h1 className="font-serif text-4xl mt-3 text-foreground">
          AI Art Database
        </h1>
        <p className="meta-text mt-5 max-w-lg leading-relaxed">
          Upload AI-generated artwork. The system automatically analyzes visual style,
          assigns categories, generates descriptors, and maps relationships between pieces.
        </p>
      </div>

      {/* Stats strip */}
      <div className="border border-border mb-16">
        <div className="grid grid-cols-3 divide-x divide-border">
          <div className="p-8">
            <Image className="h-4 w-4 text-muted-foreground mb-4" strokeWidth={1} />
            <p className="font-serif text-3xl text-foreground">{totalCount}</p>
            <p className="meta-text mt-1 uppercase tracking-widest">Artworks</p>
          </div>
          <div className="p-8">
            <Clock className="h-4 w-4 text-muted-foreground mb-4" strokeWidth={1} />
            <p className="font-serif text-3xl text-foreground">
              {artworks.filter(a => a.analysis_status === "complete").length}
            </p>
            <p className="meta-text mt-1 uppercase tracking-widest">Analyzed</p>
          </div>
          <div className="p-8">
            <Upload className="h-4 w-4 text-muted-foreground mb-4" strokeWidth={1} />
            <p className="font-serif text-3xl text-foreground">
              {artworks.filter(a => a.analysis_status === "pending").length}
            </p>
            <p className="meta-text mt-1 uppercase tracking-widest">Pending</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4 mb-16">
        {user ? (
          <Button variant="archive" onClick={() => navigate("/upload")}>
            <Upload className="h-3 w-3 mr-1.5" strokeWidth={1.5} />
            Upload Artwork
          </Button>
        ) : (
          <Button variant="archive" onClick={() => navigate("/auth")}>
            Sign in to Upload
          </Button>
        )}
        <Button variant="outline" onClick={() => navigate("/gallery")}>
          Browse Gallery
        </Button>
      </div>

      {/* Recent works */}
      <section>
        <div className="mb-8">
          <span className="section-label">Recent Acquisitions</span>
          <div className="border-t border-border mt-3" />
        </div>

        {loading ? (
          <p className="meta-text animate-pulse">Loading…</p>
        ) : artworks.length === 0 ? (
          <div className="border border-border p-20 text-center bg-card">
            <p className="meta-text">No artworks yet. Upload your first piece to begin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-gallery">
            {artworks.map((art) => (
              <div
                key={art.id}
                onClick={() => navigate(`/gallery/${art.id}`)}
                className="group cursor-pointer bg-card border border-border hover:border-foreground transition-colors"
              >
                <div className="aspect-square overflow-hidden">
                  <img src={art.image_url} alt={art.title} className="h-full w-full object-cover" loading="lazy" />
                </div>
                <div className="p-3 border-t border-border">
                  <h4 className="font-serif text-sm text-foreground truncate">{art.title}</h4>
                  <p className="meta-text mt-1">
                    {new Date(art.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

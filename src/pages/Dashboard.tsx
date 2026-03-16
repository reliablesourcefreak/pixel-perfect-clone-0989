import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Image, Upload, Clock, FolderOpen } from "lucide-react";
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
        supabase.from("artworks").select("id, title, image_url, analysis_status, created_at").order("created_at", { ascending: false }).limit(6),
      ]);
      setTotalCount(count || 0);
      setArtworks(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const analyzedCount = artworks.filter(a => a.analysis_status === "complete").length;
  const pendingCount = artworks.filter(a => a.analysis_status === "pending").length;

  return (
    <div className="px-8 py-10 max-w-6xl mx-auto">
      {/* Title */}
      <div className="mb-12">
        <span className="catalog-num">Overview — Full Archive</span>
        <h1 className="font-serif text-3xl mt-2 text-foreground">
          Workspace Index
        </h1>
        <p className="font-mono text-xs text-muted-foreground mt-2 tracking-wide max-w-lg">
          A comprehensive catalogue of all creative works. Upload AI-generated artwork and the system
          automatically analyzes visual style, assigns categories, and maps relationships.
        </p>
      </div>

      {/* Stats */}
      <section className="mb-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border">
          <div className="border border-border p-6 bg-background">
            <div className="flex items-start justify-between">
              <div>
                <span className="catalog-num">STAT-001</span>
                <p className="mt-3 text-4xl font-serif text-foreground">{totalCount}</p>
                <p className="mt-1 font-mono text-xs text-muted-foreground tracking-wide uppercase">Total Works</p>
              </div>
              <Image className="h-4 w-4 text-muted-foreground/40" strokeWidth={1} />
            </div>
          </div>
          <div className="border border-border p-6 bg-background">
            <div className="flex items-start justify-between">
              <div>
                <span className="catalog-num">STAT-002</span>
                <p className="mt-3 text-4xl font-serif text-foreground">{analyzedCount}</p>
                <p className="mt-1 font-mono text-xs text-muted-foreground tracking-wide uppercase">Analyzed</p>
              </div>
              <FolderOpen className="h-4 w-4 text-muted-foreground/40" strokeWidth={1} />
            </div>
          </div>
          <div className="border border-border p-6 bg-background">
            <div className="flex items-start justify-between">
              <div>
                <span className="catalog-num">STAT-003</span>
                <p className="mt-3 text-4xl font-serif text-foreground">{pendingCount}</p>
                <p className="mt-1 font-mono text-xs text-muted-foreground tracking-wide uppercase">Pending</p>
              </div>
              <Clock className="h-4 w-4 text-muted-foreground/40" strokeWidth={1} />
            </div>
          </div>
          <div className="border border-border p-6 bg-background flex items-center justify-center">
            {user ? (
              <Button variant="archive" size="sm" onClick={() => navigate("/upload")} className="w-full">
                <Upload className="h-3 w-3 mr-1.5" strokeWidth={1.5} />
                Upload Artwork
              </Button>
            ) : (
              <Button variant="archive" size="sm" onClick={() => navigate("/auth")} className="w-full">
                Sign In to Upload
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Recent Works */}
      <section className="mb-16">
        <div className="mb-6">
          <span className="section-label">Recent Acquisitions</span>
          <div className="border-t border-border mt-2" />
        </div>

        {loading ? (
          <div className="border border-border p-16 text-center">
            <p className="font-mono text-xs text-muted-foreground tracking-wide animate-pulse">Loading archive…</p>
          </div>
        ) : artworks.length === 0 ? (
          <div className="border border-border p-16 text-center">
            <p className="font-mono text-xs text-muted-foreground tracking-wide">
              No artworks yet. Upload your first piece to begin building the archive.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-border">
            {artworks.map((art) => (
              <div
                key={art.id}
                onClick={() => navigate(`/gallery/${art.id}`)}
                className="group cursor-pointer bg-background border border-border"
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img src={art.image_url} alt={art.title} className="h-full w-full object-cover transition-all duration-700" loading="lazy" />
                  <div className="forensic-overlay p-4 flex flex-col justify-end font-mono text-primary-foreground">
                    <span className="text-[10px] tracking-widest uppercase opacity-60">
                      {art.analysis_status === "complete" ? "Analysis Complete" : art.analysis_status}
                    </span>
                    <span className="text-xs mt-1">{art.title}</span>
                  </div>
                </div>
                <div className="p-4 border-t border-border">
                  <h4 className="font-serif text-sm text-foreground leading-snug truncate">{art.title}</h4>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="inline-block h-1 w-1 bg-muted-foreground/40" />
                    <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                      {new Date(art.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

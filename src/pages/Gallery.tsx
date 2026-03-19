import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, RefreshCw } from "lucide-react";

interface ArtworkWithTags {
  id: string;
  title: string;
  image_url: string;
  analysis_status: string;
  created_at: string;
  categories: { category: string; confidence: number }[];
  tags: { tag: string }[];
}

const CATEGORIES = [
  "Digital", "3D Render", "Concept Art", "Abstract", "Fantasy",
  "Sci-Fi", "Portrait", "Landscape", "Architecture", "Character",
  "Illustration", "Photography Style"
];

const CATEGORY_COLORS: Record<string, string> = {
  "Digital": "hsl(210, 80%, 55%)",
  "3D Render": "hsl(280, 65%, 55%)",
  "Concept Art": "hsl(35, 85%, 55%)",
  "Abstract": "hsl(330, 70%, 55%)",
  "Fantasy": "hsl(160, 60%, 45%)",
  "Sci-Fi": "hsl(195, 85%, 50%)",
  "Portrait": "hsl(15, 75%, 55%)",
  "Landscape": "hsl(120, 50%, 45%)",
  "Architecture": "hsl(45, 70%, 50%)",
  "Character": "hsl(350, 65%, 50%)",
  "Illustration": "hsl(260, 60%, 55%)",
  "Photography Style": "hsl(80, 50%, 45%)",
};

export default function Gallery() {
  const [artworks, setArtworks] = useState<ArtworkWithTags[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchArtworks = async () => {
    setLoading(true);
    const { data: arts } = await supabase
      .from("artworks")
      .select("id, title, image_url, analysis_status, created_at")
      .order("created_at", { ascending: false });

    if (!arts) { setLoading(false); return; }

    const ids = arts.map(a => a.id);
    const [{ data: cats }, { data: tags }] = await Promise.all([
      supabase.from("artwork_categories").select("artwork_id, category, confidence").in("artwork_id", ids),
      supabase.from("artwork_tags").select("artwork_id, tag").in("artwork_id", ids),
    ]);

    const enriched: ArtworkWithTags[] = arts.map(a => ({
      ...a,
      categories: (cats || []).filter(c => c.artwork_id === a.id).map(c => ({ category: c.category, confidence: Number(c.confidence) })),
      tags: (tags || []).filter(t => t.artwork_id === a.id).map(t => ({ tag: t.tag })),
    }));

    setArtworks(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchArtworks(); }, []);

  const allTags = useMemo(() => {
    const tagMap = new Map<string, number>();
    artworks.forEach(a => a.tags.forEach(t => tagMap.set(t.tag, (tagMap.get(t.tag) || 0) + 1)));
    return Array.from(tagMap.entries()).sort((a, b) => b[1] - a[1]);
  }, [artworks]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    artworks.forEach(a => a.categories.forEach(c => counts.set(c.category, (counts.get(c.category) || 0) + 1)));
    return counts;
  }, [artworks]);

  const filtered = useMemo(() => {
    let result = artworks;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.tags.some(t => t.tag.includes(q))
      );
    }
    if (selectedCategory) {
      result = result.filter(a => a.categories.some(c => c.category === selectedCategory));
    }
    if (selectedTag) {
      result = result.filter(a => a.tags.some(t => t.tag === selectedTag));
    }
    return result;
  }, [artworks, searchQuery, selectedCategory, selectedTag]);

  return (
    <div className="px-8 py-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-10 flex items-end justify-between">
        <div>
          <span className="catalog-num">Collection</span>
          <h1 className="font-serif text-5xl mt-2 text-foreground leading-tight">
            AI<br />
            <span className="text-accent">Art</span><br />
            Archive
          </h1>
          <p className="font-mono text-xs text-muted-foreground mt-4 tracking-wide max-w-md">
            Upload AI-generated artwork. The system automatically analyzes visual style,
            assigns categories, generates descriptors, and maps relationships between pieces.
          </p>
          <p className="font-mono text-xs text-muted-foreground mt-2 tracking-wide">
            {artworks.length} works in collection
          </p>
        </div>
        {user && (
          <Button variant="archive" size="sm" onClick={() => navigate("/upload")}>
            <Plus className="h-3 w-3 mr-1.5" strokeWidth={1.5} />
            Upload
          </Button>
        )}
      </div>

      <div className="border-t border-accent mb-8 border-2" />

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10">
        {/* Sidebar filters */}
        <aside className="space-y-8">
          {/* Search */}
          <div>
            <span className="section-label">Search</span>
            <div className="mt-2 relative">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Title, description..."
                className="rounded-none pr-8"
              />
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
            </div>
          </div>

          {/* Categories */}
          <div>
            <span className="section-label">Categories</span>
            <div className="mt-2 border border-border divide-y divide-border">
              {CATEGORIES.map((cat) => {
                const count = categoryCounts.get(cat) || 0;
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(isActive ? null : cat)}
                    className={`w-full flex items-center justify-between p-2.5 font-mono text-xs tracking-wide transition-colors ${
                      isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 bg-accent inline-block" style={{ opacity: count > 0 ? 1 : 0.2 }} />
                      <span>{cat}</span>
                    </div>
                    <span>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tags */}
          {allTags.length > 0 && (
            <div>
              <span className="section-label">Tags</span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {allTags.map(([tag, count]) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                    className={`font-mono text-[10px] tracking-wide px-2 py-1 border transition-colors ${
                      selectedTag === tag
                        ? "bg-foreground text-primary-foreground border-foreground"
                        : "bg-transparent text-muted-foreground border-border hover:border-foreground hover:text-foreground"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Gallery grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="font-mono text-xs text-foreground tracking-wide font-medium">All Works</span>
              <p className="font-mono text-xs text-muted-foreground tracking-wide">
                {filtered.length} artwork{filtered.length !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={fetchArtworks}
              className="font-mono text-xs text-muted-foreground hover:text-foreground tracking-wide flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="h-3 w-3" strokeWidth={1.5} /> Refresh
            </button>
          </div>

          <div className="border-t border-border mb-6" />

          {loading ? (
            <div className="border border-border p-16 text-center">
              <p className="font-mono text-xs text-muted-foreground tracking-wide animate-pulse">
                Loading archive…
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="border border-border p-16 text-center">
              <p className="font-mono text-xs text-muted-foreground tracking-wide">
                {artworks.length === 0 ? "No artworks in archive. Upload your first piece." : "No results match your filters."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-px bg-border border border-border">
              {filtered.map((art) => (
                <div
                  key={art.id}
                  onClick={() => navigate(`/gallery/${art.id}`)}
                  className="group cursor-pointer bg-background"
                >
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={art.image_url}
                      alt={art.title}
                      className="h-full w-full object-cover transition-all duration-700"
                      loading="lazy"
                    />
                    {/* Status indicator */}
                    {art.analysis_status === "complete" && (
                      <div className="absolute top-3 right-3 h-5 w-5 border border-primary-foreground/30 bg-accent/80 flex items-center justify-center">
                        <span className="text-primary-foreground text-[8px]">✓</span>
                      </div>
                    )}
                    {/* Forensic overlay on hover */}
                    <div className="forensic-overlay p-5 flex flex-col justify-end font-mono text-primary-foreground">
                      <span className="text-[10px] tracking-widest uppercase opacity-60">
                        {art.analysis_status === "complete" ? "Analysis Complete" : art.analysis_status.toUpperCase()}
                      </span>
                      <span className="text-sm font-serif mt-1.5">{art.title}</span>
                      {art.categories.length > 0 && (
                        <div className="flex gap-2 mt-3">
                          {art.categories.slice(0, 3).map((c) => (
                            <span key={c.category} className="text-[10px] opacity-70">
                              {c.category} {c.confidence}%
                            </span>
                          ))}
                        </div>
                      )}
                      {art.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {art.tags.slice(0, 4).map((t) => (
                            <span key={t.tag} className="text-[9px] px-1.5 py-0.5 border border-primary-foreground/30">
                              {t.tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-3 border-t border-border">
                    <h4 className="font-serif text-sm text-foreground truncate">{art.title}</h4>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

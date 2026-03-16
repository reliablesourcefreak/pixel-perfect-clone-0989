import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, RefreshCw } from "lucide-react";
import { GalleryFilters } from "@/components/gallery/GalleryFilters";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";

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
    <div className="px-10 pt-[100px] pb-16 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-16 flex items-end justify-between">
        <div>
          <span className="catalog-num">Collection</span>
          <h1 className="font-serif text-5xl mt-3 text-foreground leading-tight">
            AI Art Archive
          </h1>
          <p className="meta-text mt-5 max-w-lg leading-relaxed">
            Upload AI-generated artwork. The system automatically analyzes visual style,
            assigns categories, generates descriptors, and maps relationships between pieces.
          </p>
          <p className="meta-text mt-2">
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

      <div className="border-t border-border mb-12" />

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-16">
        {/* Sidebar filters */}
        <GalleryFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          categories={CATEGORIES}
          categoryCounts={categoryCounts}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          allTags={allTags}
          selectedTag={selectedTag}
          onTagChange={setSelectedTag}
        />

        {/* Gallery grid */}
        <GalleryGrid
          artworks={filtered}
          loading={loading}
          totalCount={artworks.length}
          onRefresh={fetchArtworks}
          onArtworkClick={(id) => navigate(`/gallery/${id}`)}
        />
      </div>
    </div>
  );
}

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search, RefreshCw, FolderPlus, CheckSquare, SlidersHorizontal, X, Calendar } from "lucide-react";
import { toast } from "sonner";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { GalleryGridSkeleton } from "@/components/orbit/GallerySkeletons";
import { BulkToolbar } from "@/components/orbit/BulkToolbar";
import { format, subDays, subMonths, isAfter, parseISO } from "date-fns";

interface ArtworkWithTags {
  id: string;
  title: string;
  image_url: string;
  analysis_status: string;
  created_at: string;
  categories: { category: string; confidence: number }[];
  tags: { tag: string }[];
  moods: string[];
  styles: string[];
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

const DATE_RANGES = [
  { label: "All Time", value: "all" },
  { label: "Last 7 Days", value: "7d" },
  { label: "Last 30 Days", value: "30d" },
  { label: "Last 3 Months", value: "3m" },
  { label: "Last Year", value: "1y" },
];

const ANALYSIS_STATUSES = [
  { label: "All", value: "all" },
  { label: "Analyzed", value: "complete" },
  { label: "Pending", value: "pending" },
];

export default function Gallery() {
  const [artworks, setArtworks] = useState<ArtworkWithTags[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [collections, setCollections] = useState<{ id: string; name: string; color: string }[]>([]);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 180);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
      if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const fetchArtworks = useCallback(async () => {
    setLoading(true);
    const { data: arts } = await supabase
      .from("artworks")
      .select("id, title, image_url, analysis_status, created_at")
      .order("created_at", { ascending: false });

    if (!arts) { setLoading(false); return; }

    const ids = arts.map(a => a.id);
    const [{ data: cats }, { data: tags }, { data: analysis }] = await Promise.all([
      supabase.from("artwork_categories").select("artwork_id, category, confidence").in("artwork_id", ids),
      supabase.from("artwork_tags").select("artwork_id, tag").in("artwork_id", ids),
      supabase.from("artwork_analysis").select("artwork_id, moods, styles").in("artwork_id", ids),
    ]);

    const analysisMap = new Map((analysis || []).map(a => [a.artwork_id, a]));

    const enriched: ArtworkWithTags[] = arts.map(a => {
      const an = analysisMap.get(a.id);
      return {
        ...a,
        categories: (cats || []).filter(c => c.artwork_id === a.id).map(c => ({ category: c.category, confidence: Number(c.confidence) })),
        tags: (tags || []).filter(t => t.artwork_id === a.id).map(t => ({ tag: t.tag })),
        moods: (an?.moods as string[]) || [],
        styles: (an?.styles as string[]) || [],
      };
    });

    setArtworks(enriched);
    setLoading(false);
  }, []);

  useEffect(() => { fetchArtworks(); }, [fetchArtworks]);

  useEffect(() => {
    if (user) {
      supabase.from("collections").select("id, name, color").then(({ data }) => setCollections(data || []));
    }
  }, [user]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectAll = () => {
    setSelectedIds(filtered.map(a => a.id));
  };

  const addToCollection = async (artworkId: string, collectionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const { error } = await supabase.from("collection_artworks").insert({ collection_id: collectionId, artwork_id: artworkId });
    if (error) {
      if (error.code === "23505") { toast("Already in that collection"); return; }
      toast.error("Error", { description: error.message }); return;
    }
    toast("Added to collection");
  };

  const allTags = useMemo(() => {
    const tagMap = new Map<string, number>();
    artworks.forEach(a => a.tags.forEach(t => tagMap.set(t.tag, (tagMap.get(t.tag) || 0) + 1)));
    return Array.from(tagMap.entries()).sort((a, b) => b[1] - a[1]);
  }, [artworks]);

  const allMoods = useMemo(() => {
    const map = new Map<string, number>();
    artworks.forEach(a => a.moods.forEach(m => map.set(m, (map.get(m) || 0) + 1)));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [artworks]);

  const allStyles = useMemo(() => {
    const map = new Map<string, number>();
    artworks.forEach(a => a.styles.forEach(s => map.set(s, (map.get(s) || 0) + 1)));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [artworks]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    artworks.forEach(a => a.categories.forEach(c => counts.set(c.category, (counts.get(c.category) || 0) + 1)));
    return counts;
  }, [artworks]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedMoods.length) count++;
    if (selectedStyles.length) count++;
    if (dateRange !== "all") count++;
    if (statusFilter !== "all") count++;
    return count;
  }, [selectedMoods, selectedStyles, dateRange, statusFilter]);

  const clearAdvancedFilters = () => {
    setSelectedMoods([]);
    setSelectedStyles([]);
    setDateRange("all");
    setStatusFilter("all");
  };

  const filtered = useMemo(() => {
    let result = artworks;
    if (debouncedQuery) {
      const q = debouncedQuery.toLowerCase();
      result = result.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.tags.some(t => t.tag.includes(q)) ||
        a.moods.some(m => m.toLowerCase().includes(q)) ||
        a.styles.some(s => s.toLowerCase().includes(q))
      );
    }
    if (selectedCategory) {
      result = result.filter(a => a.categories.some(c => c.category === selectedCategory));
    }
    if (selectedTag) {
      result = result.filter(a => a.tags.some(t => t.tag === selectedTag));
    }
    if (selectedMoods.length) {
      result = result.filter(a => selectedMoods.some(m => a.moods.includes(m)));
    }
    if (selectedStyles.length) {
      result = result.filter(a => selectedStyles.some(s => a.styles.includes(s)));
    }
    if (dateRange !== "all") {
      const now = new Date();
      const cutoff = dateRange === "7d" ? subDays(now, 7)
        : dateRange === "30d" ? subDays(now, 30)
        : dateRange === "3m" ? subMonths(now, 3)
        : subMonths(now, 12);
      result = result.filter(a => isAfter(parseISO(a.created_at), cutoff));
    }
    if (statusFilter !== "all") {
      result = result.filter(a => a.analysis_status === statusFilter);
    }
    return result;
  }, [artworks, debouncedQuery, selectedCategory, selectedTag, selectedMoods, selectedStyles, dateRange, statusFilter]);

  const toggleMood = (mood: string) => {
    setSelectedMoods(prev => prev.includes(mood) ? prev.filter(m => m !== mood) : [...prev, mood]);
  };

  const toggleStyle = (style: string) => {
    setSelectedStyles(prev => prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]);
  };

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
        <div className="flex items-center gap-2">
          {user && (
            <>
              <Button
                variant={selectMode ? "default" : "outline"}
                size="sm"
                onClick={() => { setSelectMode(!selectMode); setSelectedIds([]); }}
                className="font-mono text-xs tracking-wide"
              >
                <CheckSquare className="h-3 w-3 mr-1.5" strokeWidth={1.5} />
                {selectMode ? "Cancel" : "Select"}
              </Button>
              <Button variant="archive" size="sm" onClick={() => navigate("/upload")}>
                <Plus className="h-3 w-3 mr-1.5" strokeWidth={1.5} />
                Upload
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="border-t border-accent mb-8 border-2" />

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10">
        {/* Sidebar filters */}
        <aside className="space-y-8">
          <div>
            <span className="section-label">Search</span>
            <div className="mt-2 relative">
              <Input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Title, tag, mood, style…  (press /)"
                className="rounded-none pr-8"
              />
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
            </div>
          </div>

          {/* Advanced Filters Toggle */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 w-full justify-between group"
            >
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-3.5 w-3.5 text-accent" strokeWidth={1.5} />
                <span className="section-label">Advanced Filters</span>
              </div>
              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && (
                  <span className="font-mono text-[9px] bg-accent text-primary-foreground px-1.5 py-0.5">{activeFilterCount}</span>
                )}
                <span className="font-mono text-[10px] text-muted-foreground">{showAdvanced ? "−" : "+"}</span>
              </div>
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-5 border border-border p-4">
                {/* Clear all */}
                {activeFilterCount > 0 && (
                  <button onClick={clearAdvancedFilters} className="font-mono text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 tracking-wide">
                    <X className="h-3 w-3" strokeWidth={1.5} /> Clear filters
                  </button>
                )}

                {/* Date Range */}
                <div>
                  <span className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase flex items-center gap-1.5 mb-2">
                    <Calendar className="h-3 w-3" strokeWidth={1.5} /> Date Range
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {DATE_RANGES.map(d => (
                      <button
                        key={d.value}
                        onClick={() => setDateRange(d.value)}
                        className={`font-mono text-[10px] tracking-wide px-2 py-1 border transition-colors ${
                          dateRange === d.value
                            ? "bg-foreground text-primary-foreground border-foreground"
                            : "text-muted-foreground border-border hover:border-foreground hover:text-foreground"
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Analysis Status */}
                <div>
                  <span className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase mb-2 block">Status</span>
                  <div className="flex gap-1">
                    {ANALYSIS_STATUSES.map(s => (
                      <button
                        key={s.value}
                        onClick={() => setStatusFilter(s.value)}
                        className={`font-mono text-[10px] tracking-wide px-2 py-1 border transition-colors ${
                          statusFilter === s.value
                            ? "bg-foreground text-primary-foreground border-foreground"
                            : "text-muted-foreground border-border hover:border-foreground hover:text-foreground"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Moods */}
                {allMoods.length > 0 && (
                  <div>
                    <span className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase mb-2 block">Moods</span>
                    <div className="flex flex-wrap gap-1">
                      {allMoods.slice(0, 15).map(([mood, count]) => (
                        <button
                          key={mood}
                          onClick={() => toggleMood(mood)}
                          className={`font-mono text-[10px] tracking-wide px-2 py-1 border transition-colors ${
                            selectedMoods.includes(mood)
                              ? "bg-foreground text-primary-foreground border-foreground"
                              : "text-muted-foreground border-border hover:border-foreground hover:text-foreground"
                          }`}
                        >
                          {mood} <span className="opacity-60">{count}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Styles */}
                {allStyles.length > 0 && (
                  <div>
                    <span className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase mb-2 block">Styles</span>
                    <div className="flex flex-wrap gap-1">
                      {allStyles.slice(0, 15).map(([style, count]) => (
                        <button
                          key={style}
                          onClick={() => toggleStyle(style)}
                          className={`font-mono text-[10px] tracking-wide px-2 py-1 border transition-colors ${
                            selectedStyles.includes(style)
                              ? "bg-foreground text-primary-foreground border-foreground"
                              : "text-muted-foreground border-border hover:border-foreground hover:text-foreground"
                          }`}
                        >
                          {style} <span className="opacity-60">{count}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

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
                      <span className="h-2 w-2 inline-block" style={{ backgroundColor: CATEGORY_COLORS[cat] || "hsl(0,0%,50%)", opacity: count > 0 ? 1 : 0.2 }} />
                      <span>{cat}</span>
                    </div>
                    <span>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

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
          {/* Bulk toolbar */}
          <BulkToolbar
            selectedIds={selectedIds}
            collections={collections}
            onClear={() => { setSelectedIds([]); setSelectMode(false); }}
            onActionComplete={fetchArtworks}
          />

          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="font-mono text-xs text-foreground tracking-wide font-medium">All Works</span>
              <p className="font-mono text-xs text-muted-foreground tracking-wide">
                {filtered.length} artwork{filtered.length !== 1 ? "s" : ""}
                {activeFilterCount > 0 && ` (${activeFilterCount} filter${activeFilterCount > 1 ? "s" : ""} active)`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {selectMode && filtered.length > 0 && (
                <button
                  onClick={selectAll}
                  className="font-mono text-xs text-muted-foreground hover:text-foreground tracking-wide transition-colors"
                >
                  Select All
                </button>
              )}
              <button
                onClick={fetchArtworks}
                className="font-mono text-xs text-muted-foreground hover:text-foreground tracking-wide flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="h-3 w-3" strokeWidth={1.5} /> Refresh
              </button>
            </div>
          </div>

          <div className="border-t border-border mb-6" />

          {loading ? (
            <GalleryGridSkeleton />
          ) : filtered.length === 0 ? (
            <div className="border border-border p-16 text-center">
              <p className="font-mono text-xs text-muted-foreground tracking-wide">
                {artworks.length === 0 ? "No artworks in archive. Upload your first piece." : "No results match your filters."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-px bg-border border border-border">
              {filtered.map((art) => {
                const isSelected = selectedIds.includes(art.id);
                return (
                  <div
                    key={art.id}
                    onClick={() => selectMode ? toggleSelect(art.id) : navigate(`/gallery/${art.id}`)}
                    className={`group cursor-pointer bg-background relative ${isSelected ? "ring-2 ring-inset ring-accent" : ""}`}
                  >
                    {selectMode && (
                      <div className="absolute top-3 left-3 z-10" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(art.id)}
                          className="h-5 w-5 border-2 border-primary-foreground/60 bg-foreground/40 data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                        />
                      </div>
                    )}

                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={art.image_url}
                        alt={art.title}
                        className="h-full w-full object-cover transition-all duration-700"
                        loading="lazy"
                      />
                      {art.analysis_status === "complete" && (
                        <div className="absolute top-3 right-3 h-5 w-5 border border-primary-foreground/30 bg-accent/80 flex items-center justify-center">
                          <span className="text-primary-foreground text-[8px]">✓</span>
                        </div>
                      )}
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
                    <div className="p-3 border-t border-border flex items-center justify-between">
                      <h4 className="font-serif text-sm text-foreground truncate">{art.title}</h4>
                      {!selectMode && user && collections.length > 0 && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                              title="Add to collection"
                            >
                              <FolderPlus className="h-3.5 w-3.5" strokeWidth={1.5} />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48 p-0 rounded-none" align="end">
                            <div className="divide-y divide-border">
                              {collections.map(col => (
                                <button
                                  key={col.id}
                                  onClick={(e) => addToCollection(art.id, col.id, e)}
                                  className="w-full flex items-center gap-2 p-2.5 font-mono text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                                >
                                  <span className="h-2 w-2 shrink-0" style={{ backgroundColor: col.color }} />
                                  <span className="truncate">{col.name}</span>
                                </button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

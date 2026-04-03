import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Upload, ArrowRight, Layers, Tag, TrendingUp, Zap } from "lucide-react";
import { DashboardSkeleton } from "@/components/orbit/GallerySkeletons";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface DashboardArtwork {
  id: string;
  title: string;
  image_url: string;
  analysis_status: string;
  created_at: string;
}

interface CategoryStat { category: string; count: number; }
interface TagStat { tag: string; count: number; }

export default function Dashboard() {
  const [artworks, setArtworks] = useState<DashboardArtwork[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [categories, setCategories] = useState<CategoryStat[]>([]);
  const [tags, setTags] = useState<TagStat[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const load = async () => {
      const [{ count }, { data: recent }, { data: cats }, { data: allTags }] = await Promise.all([
        supabase.from("artworks").select("*", { count: "exact", head: true }),
        supabase.from("artworks").select("id, title, image_url, analysis_status, created_at").order("created_at", { ascending: false }).limit(8),
        supabase.from("artwork_categories").select("category"),
        supabase.from("artwork_tags").select("tag"),
      ]);
      setTotalCount(count || 0);
      setArtworks(recent || []);

      const catMap = new Map<string, number>();
      (cats || []).forEach((c: any) => catMap.set(c.category, (catMap.get(c.category) || 0) + 1));
      setCategories(Array.from(catMap.entries()).map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count));

      const tagMap = new Map<string, number>();
      (allTags || []).forEach((t: any) => tagMap.set(t.tag, (tagMap.get(t.tag) || 0) + 1));
      setTags(Array.from(tagMap.entries()).map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count).slice(0, 30));

      setLoading(false);
    };
    load();
  }, []);

  const analyzedCount = useMemo(() => artworks.filter(a => a.analysis_status === "complete").length, [artworks]);
  const latestWork = artworks[0];
  const maxCatCount = categories[0]?.count || 1;

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="px-8 py-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-14">
        <span className="catalog-num">Dashboard — Live</span>
        <div className="mt-4 flex items-end justify-between gap-8">
          <div>
            <h1 className="font-serif text-5xl lg:text-6xl text-foreground leading-[1.1] tracking-tight">
              Art<br /><span className="text-accent italic">Archive</span>
            </h1>
            <p className="font-mono text-xs text-muted-foreground mt-5 tracking-wide max-w-md leading-relaxed">
              Upload → Analyze → Categorize → Connect. Everything is automatic.
            </p>
          </div>
          <div className="hidden lg:block text-right">
            <p className="font-serif text-7xl text-foreground">{totalCount}</p>
            <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase mt-1">Works Archived</p>
          </div>
        </div>
      </div>

      <div className="border-t-2 border-accent mb-12" />

      {/* Quick actions */}
      <div className="flex gap-3 mb-12">
        {user ? (
          <Button variant="archive" onClick={() => navigate("/upload")} className="group">
            <Upload className="h-3.5 w-3.5 mr-2" strokeWidth={1.5} />
            Upload New Work
            <ArrowRight className="h-3 w-3 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={1.5} />
          </Button>
        ) : (
          <Button variant="archive" onClick={() => navigate("/auth")}>Sign In to Start</Button>
        )}
        <Button variant="outline" className="font-mono text-xs tracking-wide border-border hover:border-foreground" onClick={() => navigate("/gallery")}>
          Gallery
        </Button>
        <Button variant="outline" className="font-mono text-xs tracking-wide border-border hover:border-foreground" onClick={() => navigate("/mindmap")}>
          Mindmap
        </Button>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-border border border-border">
        {/* Hero spotlight */}
        <div className="lg:col-span-2 bg-background">
          {latestWork ? (
            <div className="group cursor-pointer relative" onClick={() => navigate(`/gallery/${latestWork.id}`)}>
              <div className="relative aspect-[16/9] overflow-hidden">
                <img src={latestWork.image_url} alt={latestWork.title} className="h-full w-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
                  <span className="font-mono text-[10px] text-primary-foreground/60 tracking-widest uppercase">Latest</span>
                  <h3 className="font-serif text-2xl text-primary-foreground mt-1">{latestWork.title}</h3>
                </div>
              </div>
              <div className="p-5 border-t border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="catalog-num">Latest Work</span>
                    <h3 className="font-serif text-lg text-foreground mt-1 truncate">{latestWork.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 ${latestWork.analysis_status === "complete" ? "bg-accent" : "bg-muted-foreground/30"}`} />
                    <span className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">{latestWork.analysis_status}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-16 text-center">
              <Zap className="h-8 w-8 text-muted-foreground/30 mx-auto mb-4" strokeWidth={1} />
              <p className="font-mono text-xs text-muted-foreground tracking-wide">Upload your first artwork to get started.</p>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="bg-background flex flex-col divide-y divide-border">
          <div className="p-6 flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-3">
              <Layers className="h-3.5 w-3.5 text-accent" strokeWidth={1.5} />
              <span className="section-label">Status</span>
            </div>
            <div className="space-y-4">
              {[
                { label: "Total Works", value: totalCount },
                { label: "Analyzed", value: analyzedCount, bar: true },
                { label: "Categories", value: categories.length },
                { label: "Tags", value: tags.length },
              ].map(s => (
                <div key={s.label}>
                  <div className="flex justify-between mb-1">
                    <span className="font-mono text-[10px] text-muted-foreground tracking-wide">{s.label}</span>
                    <span className="font-serif text-lg text-foreground">{s.value}</span>
                  </div>
                  {s.bar ? (
                    <div className="h-0.5 bg-border relative overflow-hidden">
                      <div className="absolute inset-y-0 left-0 bg-accent" style={{ width: totalCount ? `${(analyzedCount / totalCount) * 100}%` : "0%" }} />
                    </div>
                  ) : <div className="h-px bg-border" />}
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 flex-1">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-3.5 w-3.5 text-accent" strokeWidth={1.5} />
              <span className="section-label">Recent</span>
            </div>
            <div className="space-y-2">
              {artworks.slice(0, 4).map(art => (
                <div key={art.id} onClick={() => navigate(`/gallery/${art.id}`)} className="flex items-center gap-3 cursor-pointer group/item hover:bg-secondary transition-colors p-1.5 -mx-1.5">
                  <img src={art.image_url} alt="" className="h-8 w-8 object-cover border border-border shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[10px] text-foreground truncate group-hover/item:text-accent transition-colors">{art.title}</p>
                    <p className="font-mono text-[9px] text-muted-foreground tracking-wide">{format(new Date(art.created_at), "MMM d")}</p>
                  </div>
                  <span className={`h-1.5 w-1.5 shrink-0 ${art.analysis_status === "complete" ? "bg-accent" : "bg-muted-foreground/30"}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Categories + Tags */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-border border border-border border-t-0">
        <div className="bg-background p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="section-label">Categories</span>
            <button onClick={() => navigate("/gallery")} className="font-mono text-[10px] text-muted-foreground hover:text-foreground tracking-wide transition-colors">View All →</button>
          </div>
          {categories.length === 0 ? (
            <p className="font-mono text-xs text-muted-foreground tracking-wide">Upload artworks to see categories.</p>
          ) : (
            <div className="space-y-2.5">
              {categories.slice(0, 8).map(cat => (
                <div key={cat.category}>
                  <div className="flex justify-between mb-1">
                    <span className="font-mono text-[10px] text-foreground tracking-wide">{cat.category}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{cat.count}</span>
                  </div>
                  <div className="h-1 bg-secondary relative overflow-hidden">
                    <div className="absolute inset-y-0 left-0 bg-foreground transition-all duration-700" style={{ width: `${(cat.count / maxCatCount) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-background p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Tag className="h-3 w-3 text-accent" strokeWidth={1.5} />
              <span className="section-label">Tags</span>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">{tags.length}</span>
          </div>
          {tags.length === 0 ? (
            <p className="font-mono text-xs text-muted-foreground tracking-wide">Tags appear after analysis.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {tags.map(({ tag, count }) => {
                const maxTag = tags[0]?.count || 1;
                const intensity = Math.max(0.4, count / maxTag);
                return (
                  <button key={tag} onClick={() => navigate("/gallery")} className="font-mono px-2 py-1 border border-border hover:border-foreground hover:bg-secondary transition-colors" style={{ fontSize: `${Math.max(9, Math.min(13, 9 + (count / maxTag) * 4))}px`, opacity: intensity }}>
                    {tag}<span className="ml-1 text-muted-foreground">{count}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Filmstrip */}
      {artworks.length > 1 && (
        <section className="mt-12 mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="section-label">Recent Acquisitions</span>
            <button onClick={() => navigate("/gallery")} className="font-mono text-[10px] text-muted-foreground hover:text-foreground tracking-wide transition-colors">Full Archive →</button>
          </div>
          <div className="border-t border-border mb-6" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-px bg-border border border-border">
            {artworks.slice(1, 9).map(art => (
              <div key={art.id} onClick={() => navigate(`/gallery/${art.id}`)} className="group cursor-pointer bg-background">
                <div className="relative aspect-square overflow-hidden">
                  <img src={art.image_url} alt={art.title} className="h-full w-full object-cover transition-all duration-700" loading="lazy" />
                  <div className="forensic-overlay p-3 flex flex-col justify-end font-mono text-primary-foreground">
                    <span className="text-[10px] tracking-widest uppercase opacity-60">{art.analysis_status === "complete" ? "Analyzed" : art.analysis_status}</span>
                    <span className="text-xs mt-1 font-serif">{art.title}</span>
                  </div>
                </div>
                <div className="p-3 border-t border-border">
                  <h4 className="font-serif text-xs text-foreground truncate">{art.title}</h4>
                  <span className="font-mono text-[9px] text-muted-foreground tracking-widest uppercase">{format(new Date(art.created_at), "MMM d")}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

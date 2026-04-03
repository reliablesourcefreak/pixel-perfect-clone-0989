import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Image, BookOpen, BookText, Filter } from "lucide-react";

type TimelineItemType = "artwork" | "codex" | "story";

interface TimelineItem {
  id: string;
  type: TimelineItemType;
  title: string;
  date: string;
  imageUrl?: string;
  meta: string;
  link: string;
}

const TYPE_CONFIG: Record<TimelineItemType, { icon: typeof Image; label: string; color: string }> = {
  artwork: { icon: Image, label: "Artwork", color: "hsl(var(--accent))" },
  codex: { icon: BookOpen, label: "Codex", color: "hsl(210, 80%, 55%)" },
  story: { icon: BookText, label: "Story", color: "hsl(280, 65%, 55%)" },
};

export default function Timeline() {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TimelineItemType | "all">("all");
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const [{ data: arts }, { data: codex }, { data: stories }] = await Promise.all([
        supabase.from("artworks").select("id, title, image_url, analysis_status, created_at").order("created_at", { ascending: false }),
        supabase.from("codex_entries").select("id, title, type, created_at").order("created_at", { ascending: false }),
        supabase.from("stories").select("id, title, status, created_at").order("created_at", { ascending: false }),
      ]);

      const all: TimelineItem[] = [
        ...(arts || []).map(a => ({
          id: a.id, type: "artwork" as const, title: a.title, date: a.created_at,
          imageUrl: a.image_url, meta: a.analysis_status === "complete" ? "Analyzed" : a.analysis_status,
          link: `/gallery/${a.id}`,
        })),
        ...(codex || []).map(c => ({
          id: c.id, type: "codex" as const, title: c.title, date: c.created_at,
          meta: c.type, link: `/codex/${c.id}`,
        })),
        ...(stories || []).map(s => ({
          id: s.id, type: "story" as const, title: s.title, date: s.created_at,
          meta: s.status, link: `/stories/${s.id}`,
        })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setItems(all);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = useMemo(() =>
    filter === "all" ? items : items.filter(i => i.type === filter),
  [items, filter]);

  const grouped = useMemo(() => {
    const groups: [string, TimelineItem[]][] = [];
    const map = new Map<string, TimelineItem[]>();
    filtered.forEach(item => {
      const key = format(parseISO(item.date), "MMMM yyyy");
      if (!map.has(key)) { map.set(key, []); groups.push([key, map.get(key)!]); }
      map.get(key)!.push(item);
    });
    return groups;
  }, [filtered]);

  const counts = useMemo(() => ({
    all: items.length,
    artwork: items.filter(i => i.type === "artwork").length,
    codex: items.filter(i => i.type === "codex").length,
    story: items.filter(i => i.type === "story").length,
  }), [items]);

  return (
    <div className="px-8 py-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <span className="catalog-num">Chronological Record</span>
        <h1 className="font-serif text-4xl mt-2 text-foreground">Timeline</h1>
        <p className="font-mono text-xs text-muted-foreground mt-3 tracking-wide max-w-lg">
          A living chronicle of creative evolution — every artwork uploaded, knowledge recorded,
          and narrative begun, mapped across time.
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-1.5 mb-8">
        <Filter className="h-3 w-3 text-muted-foreground mr-1" strokeWidth={1.5} />
        {(["all", "artwork", "codex", "story"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`font-mono text-[10px] tracking-widest uppercase px-3 py-1.5 border transition-colors ${
              filter === f
                ? "bg-foreground text-primary-foreground border-foreground"
                : "text-muted-foreground border-border hover:border-foreground hover:text-foreground"
            }`}
          >
            {f === "all" ? "All" : TYPE_CONFIG[f].label}
            <span className="ml-1.5 opacity-60">{counts[f]}</span>
          </button>
        ))}
      </div>

      <div className="border-t-2 border-accent mb-10" />

      {loading ? (
        <div className="space-y-8 ml-6">
          {Array.from({ length: 3 }).map((_, g) => (
            <div key={g}>
              <Skeleton className="h-6 w-40 mb-4 rounded-none" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-4 mb-3">
                  <Skeleton className="h-16 w-16 rounded-none shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-24 rounded-none" />
                    <Skeleton className="h-4 w-48 rounded-none" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-border p-16 text-center">
          <p className="font-mono text-xs text-muted-foreground tracking-wide">
            {items.length === 0 ? "Upload artworks, create codex entries, or start stories to populate the timeline." : "No items match this filter."}
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical spine */}
          <div className="absolute left-[7px] top-0 bottom-0 w-px bg-border" />

          {grouped.map(([month, monthItems]) => (
            <div key={month} className="mb-12">
              {/* Month marker */}
              <div className="relative pl-10 mb-6">
                <div className="absolute left-0 top-1 h-[15px] w-[15px] bg-foreground" />
                <h2 className="font-serif text-2xl text-foreground">{month}</h2>
                <span className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
                  {monthItems.length} event{monthItems.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Items */}
              <div className="space-y-0">
                {monthItems.map((item) => {
                  const config = TYPE_CONFIG[item.type];
                  const Icon = config.icon;
                  return (
                    <div key={`${item.type}-${item.id}`} className="relative pl-10">
                      {/* Node */}
                      <div
                        className="absolute left-0 top-3 h-[15px] w-[15px] border-2 bg-background"
                        style={{ borderColor: config.color }}
                      />

                      <div
                        onClick={() => navigate(item.link)}
                        className="border border-border hover:bg-secondary transition-colors cursor-pointer mb-3"
                      >
                        <div className="flex">
                          {/* Image or icon placeholder */}
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.title} className="w-20 h-20 object-cover border-r border-border shrink-0" loading="lazy" />
                          ) : (
                            <div className="w-20 h-20 border-r border-border shrink-0 flex items-center justify-center bg-secondary">
                              <Icon className="h-6 w-6 text-muted-foreground/40" strokeWidth={1} />
                            </div>
                          )}

                          <div className="p-4 flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <span className="catalog-num">{format(parseISO(item.date), "MMM d, h:mma")}</span>
                                <span
                                  className="font-mono text-[9px] tracking-[0.15em] uppercase px-1.5 py-0.5 border"
                                  style={{ borderColor: config.color, color: config.color }}
                                >
                                  {config.label}
                                </span>
                              </div>
                              <span className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">{item.meta}</span>
                            </div>
                            <h4 className="font-serif text-sm text-foreground truncate">{item.title}</h4>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Terminal node */}
          <div className="relative pl-10">
            <div className="absolute left-0 top-0 h-[15px] w-[15px] bg-muted-foreground/20" />
            <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase pt-0.5">
              Beginning of archive
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

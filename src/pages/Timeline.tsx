import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface TimelineArt {
  id: string;
  title: string;
  image_url: string;
  analysis_status: string;
  created_at: string;
}

export default function Timeline() {
  const [artworks, setArtworks] = useState<TimelineArt[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase
      .from("artworks")
      .select("id, title, image_url, analysis_status, created_at")
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setArtworks(data || []);
        setLoading(false);
      });
  }, []);

  const grouped = useMemo(() => {
    const groups: Record<string, TimelineArt[]> = {};
    artworks.forEach((art) => {
      const key = format(new Date(art.created_at), "MMMM yyyy");
      (groups[key] = groups[key] || []).push(art);
    });
    return Object.entries(groups);
  }, [artworks]);

  return (
    <div className="px-8 py-10 max-w-4xl mx-auto">
      <div className="mb-12">
        <span className="catalog-num">Chronological View</span>
        <h1 className="font-serif text-3xl mt-2 text-foreground">Timeline</h1>
        <p className="font-mono text-xs text-muted-foreground mt-2 tracking-wide">
          Creative evolution — {artworks.length} works across {grouped.length} period{grouped.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="border-t border-border" />

      {loading ? (
        <div className="border border-border p-16 text-center mt-8">
          <p className="font-mono text-xs text-muted-foreground tracking-wide animate-pulse">Loading timeline…</p>
        </div>
      ) : artworks.length === 0 ? (
        <div className="border border-border p-16 text-center mt-8">
          <p className="font-mono text-xs text-muted-foreground tracking-wide">Upload artworks to populate the timeline.</p>
        </div>
      ) : (
        <div className="border-l border-border ml-3 mt-8 space-y-0">
          {grouped.map(([month, arts]) => (
            <div key={month}>
              <div className="relative pl-8 pb-6">
                <div className="absolute left-0 top-1 -translate-x-[calc(50%+0.5px)] h-3 w-3 bg-foreground" />
                <h3 className="font-serif text-xl text-foreground">{month}</h3>
                <span className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
                  {arts.length} work{arts.length !== 1 ? "s" : ""} catalogued
                </span>
              </div>

              {arts.map((art) => (
                <div key={art.id} className="relative pl-8 pb-6">
                  <div className="absolute left-0 top-2 -translate-x-[calc(50%+0.5px)] h-1.5 w-1.5 border border-border bg-background" />
                  <div
                    onClick={() => navigate(`/gallery/${art.id}`)}
                    className="border border-border hover:bg-secondary transition-colors cursor-pointer"
                  >
                    <div className="flex">
                      <img src={art.image_url} alt={art.title} className="w-20 h-20 object-cover border-r border-border shrink-0" />
                      <div className="p-4 flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="catalog-num">{format(new Date(art.created_at), "MMM d")}</span>
                          <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">{art.analysis_status}</span>
                        </div>
                        <h4 className="font-serif text-sm text-foreground mt-1 truncate">{art.title}</h4>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

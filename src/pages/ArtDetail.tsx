import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface AnalysisData {
  ai_description: string | null;
  composition: string | null;
  technical_details: string | null;
  color_palette: any;
  styles: string[] | null;
  moods: string[] | null;
}

interface ArtworkDetail {
  id: string;
  title: string;
  image_url: string;
  analysis_status: string;
  file_size_bytes: number | null;
  width: number | null;
  height: number | null;
  created_at: string;
  analysis: AnalysisData | null;
  categories: { category: string; confidence: number }[];
  tags: string[];
}

export default function ArtDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [artwork, setArtwork] = useState<ArtworkDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedArtworks, setRelatedArtworks] = useState<{ id: string; title: string; image_url: string; matchType: string; matchScore: number }[]>([]);

  useEffect(() => {
    if (!id) return;

    const fetchArtwork = async () => {
      const [{ data: art }, { data: analysis }, { data: cats }, { data: tags }] = await Promise.all([
        supabase.from("artworks").select("*").eq("id", id).single(),
        supabase.from("artwork_analysis").select("*").eq("artwork_id", id).single(),
        supabase.from("artwork_categories").select("category, confidence").eq("artwork_id", id).order("confidence", { ascending: false }),
        supabase.from("artwork_tags").select("tag").eq("artwork_id", id),
      ]);

      if (!art) { setLoading(false); return; }

      setArtwork({
        ...art,
        analysis: analysis || null,
        categories: (cats || []).map(c => ({ category: c.category, confidence: Number(c.confidence) })),
        tags: (tags || []).map(t => t.tag),
      });

      // Find related artworks by shared tags
      if (tags && tags.length > 0) {
        const tagValues = tags.map(t => t.tag);
        const { data: relatedTags } = await supabase
          .from("artwork_tags")
          .select("artwork_id, tag")
          .in("tag", tagValues.slice(0, 5))
          .neq("artwork_id", id);

        if (relatedTags) {
          const scoreMap = new Map<string, { count: number; tags: string[] }>();
          relatedTags.forEach(rt => {
            const existing = scoreMap.get(rt.artwork_id) || { count: 0, tags: [] };
            existing.count++;
            existing.tags.push(rt.tag);
            scoreMap.set(rt.artwork_id, existing);
          });

          const relatedIds = Array.from(scoreMap.entries())
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 4)
            .map(([rid]) => rid);

          if (relatedIds.length > 0) {
            const { data: relArts } = await supabase
              .from("artworks")
              .select("id, title, image_url")
              .in("id", relatedIds);

            if (relArts) {
              setRelatedArtworks(relArts.map(ra => ({
                ...ra,
                matchType: "Thematic",
                matchScore: Math.round(((scoreMap.get(ra.id)?.count || 0) / tagValues.length) * 100),
              })));
            }
          }
        }
      }

      setLoading(false);
    };

    fetchArtwork();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!artwork) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="font-mono text-xs text-muted-foreground">Artwork not found in archive</p>
      </div>
    );
  }

  const a = artwork.analysis;
  const palette: { name: string; hex: string }[] = Array.isArray(a?.color_palette) ? a.color_palette : [];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Top bar */}
      <div className="px-10 py-4 border-b border-border flex items-center justify-between">
        <button
          onClick={() => navigate("/gallery")}
          className="font-mono text-xs text-muted-foreground hover:text-foreground tracking-widest uppercase transition-colors"
        >
          ← Gallery
        </button>
        <span className="catalog-num">AI Art Database</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] min-h-[calc(100vh-8rem)]">
        {/* Image */}
        <div className="border-r border-border p-8 flex items-start justify-center">
          <img
            src={artwork.image_url}
            alt={artwork.title}
            className="max-w-full max-h-[70vh] object-contain"
          />
        </div>

        {/* Analysis panel */}
        <div className="p-8 space-y-8 overflow-auto">
          <div>
            <span className="catalog-num">Artwork</span>
            <h1 className="font-serif text-3xl mt-2 text-foreground">{artwork.title}</h1>
            {artwork.analysis_status === "complete" && (
              <div className="flex items-center gap-2 mt-2">
                <span className="h-2 w-2 bg-secondary inline-block" />
                <span className="font-mono text-[10px] tracking-widest uppercase text-secondary">
                  Analysis Complete
                </span>
              </div>
            )}
            {artwork.analysis_status === "analyzing" && (
              <div className="flex items-center gap-2 mt-2">
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                  Analyzing…
                </span>
              </div>
            )}
          </div>

          <div className="border-t border-border" />

          {a && (
            <>
              {/* AI Description */}
              {a.ai_description && (
                <section>
                  <span className="section-label">AI Description</span>
                  <p className="mt-3 font-mono text-xs text-foreground leading-[1.8]">
                    {a.ai_description}
                  </p>
                </section>
              )}

              {/* Categories */}
              {artwork.categories.length > 0 && (
                <section>
                  <span className="section-label">Categories</span>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {artwork.categories.map((c) => (
                      <div key={c.category} className="flex items-center gap-2 border border-border px-3 py-1.5">
                        <span className="h-2 w-2 bg-accent inline-block" />
                        <span className="font-mono text-xs text-foreground">{c.category}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">{c.confidence}%</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Tags */}
              {artwork.tags.length > 0 && (
                <section>
                  <span className="section-label">Tags</span>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {artwork.tags.map((tag) => (
                      <span
                        key={tag}
                        className="font-mono text-[10px] tracking-widest uppercase px-2.5 py-1 border border-border text-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* Style */}
              {a.styles && a.styles.length > 0 && (
                <section>
                  <span className="section-label">Style</span>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {a.styles.map((s) => (
                      <span key={s} className="font-mono text-xs px-2.5 py-1 bg-secondary text-secondary-foreground">
                        {s}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* Mood */}
              {a.moods && a.moods.length > 0 && (
                <section>
                  <span className="section-label">Mood</span>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {a.moods.map((m) => (
                      <span key={m} className="font-mono text-xs px-2.5 py-1 bg-secondary text-secondary-foreground">
                        {m}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              <div className="border-t border-border" />

              {/* Composition */}
              {a.composition && (
                <section>
                  <span className="section-label">Composition</span>
                  <p className="mt-3 font-mono text-xs text-foreground leading-[1.8]">
                    {a.composition}
                  </p>
                </section>
              )}

              {/* Technical Details */}
              {a.technical_details && (
                <section>
                  <span className="section-label">Technical Details</span>
                  <p className="mt-3 font-mono text-xs text-foreground leading-[1.8]">
                    {a.technical_details}
                  </p>
                </section>
              )}

              {/* Color Palette */}
              {palette.length > 0 && (
                <section>
                  <span className="section-label">Color Palette</span>
                  <div className="mt-3 flex h-8 overflow-hidden border border-border">
                    {palette.map((c, i) => (
                      <div
                        key={i}
                        className="flex-1 relative group/color"
                        style={{ backgroundColor: c.hex }}
                        title={`${c.name} — ${c.hex}`}
                      >
                        <div className="absolute inset-0 flex items-end justify-center opacity-0 group-hover/color:opacity-100 transition-opacity bg-foreground/40 pb-1">
                          <span className="font-mono text-[8px] text-primary-foreground tracking-wider uppercase">
                            {c.name}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <div className="border-t border-border" />

              {/* File info */}
              <section>
                <div className="border border-border">
                  <table className="w-full font-mono text-[11px]">
                    <tbody>
                      {artwork.width && artwork.height && (
                        <tr className="border-b border-border">
                          <td className="p-2.5 text-muted-foreground tracking-widest uppercase w-32">Dimensions</td>
                          <td className="p-2.5 text-foreground">{artwork.width} × {artwork.height}px</td>
                        </tr>
                      )}
                      {artwork.file_size_bytes && (
                        <tr className="border-b border-border">
                          <td className="p-2.5 text-muted-foreground tracking-widest uppercase">File Size</td>
                          <td className="p-2.5 text-foreground">{(artwork.file_size_bytes / 1024).toFixed(1)} KB</td>
                        </tr>
                      )}
                      <tr>
                        <td className="p-2.5 text-muted-foreground tracking-widest uppercase">Added</td>
                        <td className="p-2.5 text-foreground">{new Date(artwork.created_at).toLocaleDateString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {/* Related Artworks */}
          {relatedArtworks.length > 0 && (
            <section>
              <span className="section-label">Related Artworks</span>
              <div className="mt-3 grid grid-cols-2 gap-px bg-border border border-border">
                {relatedArtworks.map((ra) => (
                  <div
                    key={ra.id}
                    onClick={() => navigate(`/gallery/${ra.id}`)}
                    className="cursor-pointer bg-background group"
                  >
                    <div className="aspect-square overflow-hidden">
                      <img src={ra.image_url} alt={ra.title} className="h-full w-full object-cover" />
                    </div>
                    <div className="p-2.5 border-t border-border">
                      <p className="font-serif text-xs text-foreground truncate">{ra.title}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="font-mono text-[10px] text-muted-foreground">{ra.matchType}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">{ra.matchScore}% match</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

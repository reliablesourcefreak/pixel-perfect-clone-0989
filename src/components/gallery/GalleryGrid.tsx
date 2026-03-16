import { RefreshCw } from "lucide-react";

interface ArtworkItem {
  id: string;
  title: string;
  image_url: string;
  analysis_status: string;
  created_at: string;
  categories: { category: string; confidence: number }[];
  tags: { tag: string }[];
}

interface GalleryGridProps {
  artworks: ArtworkItem[];
  loading: boolean;
  totalCount: number;
  onRefresh: () => void;
  onArtworkClick: (id: string) => void;
}

export function GalleryGrid({ artworks, loading, totalCount, onRefresh, onArtworkClick }: GalleryGridProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <span className="meta-text">
          {artworks.length} artwork{artworks.length !== 1 ? "s" : ""}
        </span>
        <button
          onClick={onRefresh}
          className="meta-text hover:text-foreground flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="h-3 w-3" strokeWidth={1.5} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="border border-border p-20 text-center bg-card">
          <p className="meta-text animate-pulse">Loading archive…</p>
        </div>
      ) : artworks.length === 0 ? (
        <div className="border border-border p-20 text-center bg-card">
          <p className="meta-text">
            {totalCount === 0 ? "No artworks in archive. Upload your first piece." : "No results match your filters."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-gallery">
          {artworks.map((art) => (
            <div
              key={art.id}
              onClick={() => onArtworkClick(art.id)}
              className="group cursor-pointer bg-card border border-border hover:border-foreground transition-colors"
            >
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={art.image_url}
                  alt={art.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                {/* Forensic overlay */}
                <div className="forensic-overlay p-5 flex flex-col justify-end font-mono text-primary-foreground">
                  <span className="text-[11px] tracking-widest uppercase opacity-60">
                    {art.analysis_status === "complete" ? "Analysis Complete" : art.analysis_status.toUpperCase()}
                  </span>
                  <span className="text-xs mt-1.5">{art.title}</span>
                  {art.categories.length > 0 && (
                    <div className="flex gap-3 mt-2.5">
                      {art.categories.slice(0, 3).map((c) => (
                        <span key={c.category} className="text-[10px] opacity-70">
                          {c.category} {c.confidence}%
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4 border-t border-border">
                <h4 className="font-serif text-sm text-foreground truncate">{art.title}</h4>
                <p className="meta-text mt-1.5 truncate">
                  {art.tags.slice(0, 4).map(t => t.tag).join(" · ")}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

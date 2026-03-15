import { Artwork } from "@/lib/store";

interface ArtworkCardProps {
  artwork: Artwork;
  index: number;
  delay?: number;
  onClick?: () => void;
}

export function ArtworkCard({ artwork, index, onClick }: ArtworkCardProps) {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer border border-border bg-background"
    >
      {/* Image */}
      <div className="relative aspect-[4/5] overflow-hidden">
        <img
          src={artwork.imageUrl}
          alt={artwork.title}
          className="h-full w-full object-cover transition-all duration-700"
          loading="lazy"
        />
        {/* Forensic metadata overlay */}
        <div className="forensic-overlay p-4 flex flex-col justify-between font-mono text-primary-foreground">
          <div>
            <span className="text-[10px] tracking-widest uppercase opacity-50">
              Catalogue Entry
            </span>
            <p className="text-xs mt-2 leading-relaxed opacity-80">{artwork.description}</p>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] opacity-60">
              <span>STATUS</span>
              <span className="uppercase">{artwork.status}</span>
            </div>
            <div className="flex justify-between text-[10px] opacity-60">
              <span>DATE</span>
              <span>{new Date(artwork.createdAt).toISOString().split("T")[0]}</span>
            </div>
            <div className="flex justify-between text-[10px] opacity-60">
              <span>TAGS</span>
              <span>{artwork.tags.join(", ")}</span>
            </div>
            <div className="flex justify-between text-[10px] opacity-60">
              <span>COLLECTIONS</span>
              <span>{artwork.collectionIds.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Label strip */}
      <div className="p-4 border-t border-border">
        <span className="catalog-num">ART-{String(index + 1).padStart(4, "0")}</span>
        <h4 className="font-serif text-sm mt-1 text-foreground leading-snug">{artwork.title}</h4>
        <div className="mt-2 flex items-center gap-2">
          <span className="inline-block h-1 w-1 bg-muted-foreground/40" />
          <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
            {artwork.status}
          </span>
        </div>
      </div>
    </div>
  );
}

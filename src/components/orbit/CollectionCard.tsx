import { Collection } from "@/lib/store";
import { useNavigate } from "react-router-dom";
import { Pin } from "lucide-react";

interface CollectionCardProps {
  collection: Collection;
  artworkCount: number;
  index: number;
  delay?: number;
}

export function CollectionCard({ collection, artworkCount, index }: CollectionCardProps) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/collections/${collection.id}`)}
      className="group cursor-pointer border border-border bg-background transition-colors hover:bg-secondary"
    >
      {/* Image strip */}
      <div className="relative h-48 overflow-hidden">
        {collection.coverImageUrl ? (
          <img
            src={collection.coverImageUrl}
            alt={collection.name}
            className="h-full w-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
          />
        ) : (
          <div className="h-full w-full specimen-bg" />
        )}
        {/* Forensic overlay */}
        <div className="forensic-overlay flex flex-col justify-end p-4 font-mono text-primary-foreground">
          <span className="text-[10px] tracking-widest uppercase opacity-60">Specimen View</span>
          <span className="text-xs mt-1">{collection.description}</span>
          <span className="text-[10px] mt-2 opacity-50">
            Created: {new Date(collection.createdAt).toISOString().split("T")[0]}
          </span>
        </div>
      </div>

      {/* Data strip */}
      <div className="p-5 border-t border-border">
        <div className="flex items-start justify-between">
          <div>
            <span className="catalog-num">COL-{String(index + 1).padStart(3, "0")}</span>
            <h3 className="font-serif text-lg mt-1 text-foreground">{collection.name}</h3>
          </div>
          {collection.pinned && (
            <Pin className="h-3 w-3 text-muted-foreground" strokeWidth={1.5} />
          )}
        </div>
        <div className="mt-3 flex items-center gap-4 font-mono text-[11px] text-muted-foreground tracking-wide">
          <span>{artworkCount} works</span>
          <span className="text-border">|</span>
          <span>{new Date(collection.updatedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
        </div>
      </div>
    </div>
  );
}

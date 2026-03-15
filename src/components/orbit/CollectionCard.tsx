import { motion } from "framer-motion";
import { Collection } from "@/lib/store";
import { useNavigate } from "react-router-dom";
import { Pin, MoreHorizontal } from "lucide-react";

interface CollectionCardProps {
  collection: Collection;
  artworkCount: number;
  delay?: number;
}

export function CollectionCard({ collection, artworkCount, delay = 0 }: CollectionCardProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.35, ease: "easeOut" }}
      onClick={() => navigate(`/collections/${collection.id}`)}
      className="group relative cursor-pointer overflow-hidden rounded-xl border bg-card shadow-card hover:shadow-card-hover transition-all duration-300"
    >
      <div className="relative h-40 overflow-hidden">
        {collection.coverImageUrl ? (
          <img
            src={collection.coverImageUrl}
            alt={collection.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full" style={{ backgroundColor: collection.color }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
        {collection.pinned && (
          <div className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Pin className="h-3 w-3" />
          </div>
        )}
        <div className="absolute bottom-3 left-4 right-4">
          <h3 className="font-display text-lg font-bold text-primary-foreground truncate">
            {collection.name}
          </h3>
        </div>
      </div>
      <div className="p-4">
        <p className="text-sm text-muted-foreground line-clamp-2 font-body">
          {collection.description}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-body">
            {artworkCount} artwork{artworkCount !== 1 ? "s" : ""}
          </span>
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: collection.color }}
          />
        </div>
      </div>
    </motion.div>
  );
}

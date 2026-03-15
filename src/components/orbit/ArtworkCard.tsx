import { motion } from "framer-motion";
import { Artwork } from "@/lib/store";
import { Badge } from "@/components/ui/badge";

interface ArtworkCardProps {
  artwork: Artwork;
  delay?: number;
  onClick?: () => void;
}

const statusColors: Record<string, string> = {
  reference: "bg-muted text-muted-foreground",
  draft: "bg-secondary/20 text-secondary-foreground",
  final: "bg-primary/10 text-primary",
  published: "bg-accent/10 text-accent",
};

export function ArtworkCard({ artwork, delay = 0, onClick }: ArtworkCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: "easeOut" }}
      onClick={onClick}
      className="group cursor-pointer overflow-hidden rounded-xl border bg-card shadow-card hover:shadow-card-hover transition-all duration-300"
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={artwork.imageUrl}
          alt={artwork.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex flex-wrap gap-1">
            {artwork.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-background/80 backdrop-blur-sm px-2 py-0.5 text-xs text-foreground font-body"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-display text-sm font-semibold text-card-foreground truncate">
            {artwork.title}
          </h4>
          <Badge variant="secondary" className={`text-[10px] shrink-0 ${statusColors[artwork.status]}`}>
            {artwork.status}
          </Badge>
        </div>
        <p className="mt-1 text-xs text-muted-foreground line-clamp-1 font-body">
          {artwork.description}
        </p>
      </div>
    </motion.div>
  );
}

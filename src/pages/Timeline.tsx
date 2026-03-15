import { useMemo } from "react";
import { store } from "@/lib/store";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function Timeline() {
  const artworks = useMemo(
    () => [...store.getArtworks()].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    []
  );

  // Group by month
  const grouped = useMemo(() => {
    const groups: Record<string, typeof artworks> = {};
    artworks.forEach((art) => {
      const key = format(new Date(art.createdAt), "MMMM yyyy");
      (groups[key] = groups[key] || []).push(art);
    });
    return Object.entries(groups);
  }, [artworks]);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-xs font-body font-semibold uppercase tracking-wider text-muted-foreground"
      >
        Your Creative Journey
      </motion.h3>

      <div className="relative border-l-2 border-border ml-4 space-y-8">
        {grouped.map(([month, arts], gi) => (
          <motion.div
            key={month}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: gi * 0.08 }}
          >
            {/* Month marker */}
            <div className="relative pl-8 mb-4">
              <div className="absolute left-0 top-1 -translate-x-[calc(50%+1px)] h-4 w-4 rounded-full gradient-hero" />
              <h4 className="font-display text-lg font-bold text-foreground">{month}</h4>
            </div>

            <div className="pl-8 space-y-3">
              {arts.map((art, i) => (
                <motion.div
                  key={art.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: gi * 0.08 + i * 0.04 }}
                  className="relative"
                >
                  <div className="absolute left-[-2rem] top-3 -translate-x-[calc(50%)] h-2 w-2 rounded-full bg-border" />
                  <div className="flex gap-3 rounded-xl border bg-card p-3 shadow-card hover:shadow-card-hover transition-shadow">
                    <img src={art.imageUrl} alt={art.title} className="h-16 w-16 rounded-lg object-cover shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground font-body">
                        {format(new Date(art.createdAt), "MMM d")}
                      </p>
                      <h5 className="font-display text-sm font-semibold text-card-foreground truncate">{art.title}</h5>
                      <p className="text-xs text-muted-foreground font-body line-clamp-1">{art.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

import { useMemo } from "react";
import { store } from "@/lib/store";
import { StatCard } from "@/components/orbit/StatCard";
import { CollectionCard } from "@/components/orbit/CollectionCard";
import { ArtworkCard } from "@/components/orbit/ArtworkCard";
import { Image, FolderOpen, BookOpen, BookText } from "lucide-react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const stats = useMemo(() => store.getStats(), []);
  const collections = useMemo(() => store.getCollections(), []);
  const artworks = useMemo(() => store.getArtworks(), []);
  const pinnedCollections = useMemo(() => collections.filter((c) => c.pinned), [collections]);
  const recentArtworks = useMemo(
    () => [...artworks].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4),
    [artworks]
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Stats */}
      <section>
        <motion.h3
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs font-body font-semibold uppercase tracking-wider text-muted-foreground mb-4"
        >
          Workspace Stats
        </motion.h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Artworks" value={stats.totalArtworks} icon={Image} color="coral" delay={0} />
          <StatCard label="Collections" value={stats.totalCollections} icon={FolderOpen} color="indigo" delay={0.05} />
          <StatCard label="Codex Entries" value={stats.totalCodexEntries} icon={BookOpen} color="sage" delay={0.1} />
          <StatCard label="Stories" value={stats.totalStories} icon={BookText} color="muted" delay={0.15} />
        </div>
      </section>

      {/* Pinned Collections */}
      {pinnedCollections.length > 0 && (
        <section>
          <motion.h3
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xs font-body font-semibold uppercase tracking-wider text-muted-foreground mb-4"
          >
            Pinned Collections
          </motion.h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pinnedCollections.map((col, i) => (
              <CollectionCard
                key={col.id}
                collection={col}
                artworkCount={store.getArtworksByCollection(col.id).length}
                delay={0.2 + i * 0.05}
              />
            ))}
          </div>
        </section>
      )}

      {/* Recent Uploads */}
      <section>
        <motion.h3
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xs font-body font-semibold uppercase tracking-wider text-muted-foreground mb-4"
        >
          Recent Uploads
        </motion.h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {recentArtworks.map((art, i) => (
            <ArtworkCard key={art.id} artwork={art} delay={0.3 + i * 0.05} />
          ))}
        </div>
      </section>
    </div>
  );
}

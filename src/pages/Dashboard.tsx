import { useMemo } from "react";
import { store } from "@/lib/store";
import { StatCard } from "@/components/orbit/StatCard";
import { CollectionCard } from "@/components/orbit/CollectionCard";
import { ArtworkCard } from "@/components/orbit/ArtworkCard";
import { Image, FolderOpen, BookOpen, BookText } from "lucide-react";

export default function Dashboard() {
  const stats = useMemo(() => store.getStats(), []);
  const collections = useMemo(() => store.getCollections(), []);
  const artworks = useMemo(() => store.getArtworks(), []);
  const pinnedCollections = useMemo(() => collections.filter((c) => c.pinned), [collections]);
  const recentArtworks = useMemo(
    () => [...artworks].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6),
    [artworks]
  );

  return (
    <div className="px-8 py-10 max-w-6xl mx-auto">
      {/* Title */}
      <div className="mb-12">
        <span className="catalog-num">Overview — Full Archive</span>
        <h1 className="font-serif text-3xl mt-2 text-foreground">
          Workspace Index
        </h1>
        <p className="font-mono text-xs text-muted-foreground mt-2 tracking-wide max-w-lg">
          A comprehensive catalogue of all creative works, collections, knowledge entries, and narrative threads maintained within this archive.
        </p>
      </div>

      {/* Stats */}
      <section className="mb-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border">
          <StatCard label="Total Works" value={stats.totalArtworks} icon={Image} catalogId="STAT-001" />
          <StatCard label="Collections" value={stats.totalCollections} icon={FolderOpen} catalogId="STAT-002" />
          <StatCard label="Codex Entries" value={stats.totalCodexEntries} icon={BookOpen} catalogId="STAT-003" />
          <StatCard label="Narratives" value={stats.totalStories} icon={BookText} catalogId="STAT-004" />
        </div>
      </section>

      {/* Pinned Collections */}
      {pinnedCollections.length > 0 && (
        <section className="mb-16">
          <div className="mb-6">
            <span className="section-label">Pinned Collections</span>
            <div className="border-t border-border mt-2" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border">
            {pinnedCollections.map((col, i) => (
              <CollectionCard
                key={col.id}
                collection={col}
                artworkCount={store.getArtworksByCollection(col.id).length}
                index={collections.indexOf(col)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Recent Works */}
      <section className="mb-16">
        <div className="mb-6">
          <span className="section-label">Recent Acquisitions</span>
          <div className="border-t border-border mt-2" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-border">
          {recentArtworks.map((art, i) => (
            <ArtworkCard key={art.id} artwork={art} index={artworks.indexOf(art)} />
          ))}
        </div>
      </section>
    </div>
  );
}

import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { store } from "@/lib/store";
import { ArtworkCard } from "@/components/orbit/ArtworkCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pin, Trash2, Edit2 } from "lucide-react";
import { motion } from "framer-motion";

export default function CollectionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [collection, setCollection] = useState(() => store.getCollection(id || ""));
  const artworks = useMemo(() => (id ? store.getArtworksByCollection(id) : []), [id]);

  if (!collection) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Collection not found</p>
      </div>
    );
  }

  const togglePin = () => {
    const updated = store.saveCollection({ ...collection, pinned: !collection.pinned });
    setCollection(updated);
  };

  const handleDelete = () => {
    store.deleteCollection(collection.id);
    navigate("/collections");
  };

  const codexCount = store.getCodexEntries().filter((e) => e.collectionId === id).length;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero */}
      <div className="relative h-48 overflow-hidden">
        {collection.coverImageUrl ? (
          <img src={collection.coverImageUrl} alt={collection.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full" style={{ backgroundColor: collection.color }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute bottom-4 left-6 right-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/collections")} className="mb-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" /> Collections
          </Button>
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-display font-bold text-foreground"
          >
            {collection.name}
          </motion.h1>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Meta row */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground font-body">
            <span>{artworks.length} artworks</span>
            <span>•</span>
            <span>{codexCount} codex entries</span>
            <span>•</span>
            <span>Created {new Date(collection.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={togglePin}>
              <Pin className={`h-3.5 w-3.5 mr-1 ${collection.pinned ? "text-accent" : ""}`} />
              {collection.pinned ? "Unpin" : "Pin"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleDelete} className="text-destructive hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
            </Button>
          </div>
        </div>

        <p className="text-muted-foreground font-body max-w-2xl">{collection.description}</p>

        {/* Gallery */}
        <div>
          <h3 className="text-xs font-body font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Gallery
          </h3>
          {artworks.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {artworks.map((art, i) => (
                <ArtworkCard key={art.id} artwork={art} delay={i * 0.04} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-border p-12 text-center">
              <p className="text-muted-foreground font-body">No artworks in this collection yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

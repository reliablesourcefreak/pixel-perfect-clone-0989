import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { store } from "@/lib/store";
import { ArtworkCard } from "@/components/orbit/ArtworkCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pin, Trash2 } from "lucide-react";

export default function CollectionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [collection, setCollection] = useState(() => store.getCollection(id || ""));
  const artworks = useMemo(() => (id ? store.getArtworksByCollection(id) : []), [id]);

  if (!collection) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="font-mono text-xs text-muted-foreground">Record not found in archive</p>
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
  const colIndex = store.getCollections().findIndex((c) => c.id === id);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header image */}
      <div className="relative h-64 overflow-hidden border-b border-border">
        {collection.coverImageUrl ? (
          <img src={collection.coverImageUrl} alt={collection.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full specimen-bg" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="px-8 py-10 space-y-10">
        <button
          onClick={() => navigate("/collections")}
          className="font-mono text-xs text-muted-foreground hover:text-foreground tracking-wide uppercase transition-colors"
        >
          ← Collections
        </button>

        <div>
          <span className="catalog-num">COL-{String(colIndex + 1).padStart(3, "0")}</span>
          <h1 className="font-serif text-4xl mt-2 text-foreground">{collection.name}</h1>
          <p className="font-mono text-xs text-muted-foreground mt-3 tracking-wide max-w-xl leading-relaxed">
            {collection.description}
          </p>
        </div>

        {/* Metadata table */}
        <div className="border border-border">
          <table className="w-full font-mono text-xs">
            <tbody>
              <tr className="border-b border-border">
                <td className="p-3 text-muted-foreground tracking-widest uppercase w-40">Works</td>
                <td className="p-3 text-foreground">{artworks.length}</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-3 text-muted-foreground tracking-widest uppercase">Codex Entries</td>
                <td className="p-3 text-foreground">{codexCount}</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-3 text-muted-foreground tracking-widest uppercase">Created</td>
                <td className="p-3 text-foreground">{new Date(collection.createdAt).toISOString().split("T")[0]}</td>
              </tr>
              <tr>
                <td className="p-3 text-muted-foreground tracking-widest uppercase">Status</td>
                <td className="p-3 text-foreground">{collection.pinned ? "PINNED" : "STANDARD"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex gap-3">
          <Button variant="archive" size="sm" onClick={togglePin}>
            <Pin className="h-3 w-3 mr-1.5" strokeWidth={1.5} />
            {collection.pinned ? "Unpin" : "Pin"}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDelete} className="text-destructive hover:text-destructive font-mono text-xs uppercase tracking-widest">
            <Trash2 className="h-3 w-3 mr-1.5" strokeWidth={1.5} /> Remove
          </Button>
        </div>

        {/* Gallery */}
        <div>
          <div className="mb-6">
            <span className="section-label">Gallery — {artworks.length} Works</span>
            <div className="border-t border-border mt-2" />
          </div>
          {artworks.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-border border border-border">
              {artworks.map((art, i) => (
                <ArtworkCard key={art.id} artwork={art} index={i} />
              ))}
            </div>
          ) : (
            <div className="border border-border p-16 text-center">
              <p className="font-mono text-xs text-muted-foreground tracking-wide">
                No specimens catalogued in this collection
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

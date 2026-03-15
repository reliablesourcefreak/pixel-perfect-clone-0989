import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { store } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Trash2, Save } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ArtworkCard } from "@/components/orbit/ArtworkCard";

export default function CodexDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [entry, setEntry] = useState(() => store.getCodexEntry(id || ""));
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(entry?.title || "");
  const [content, setContent] = useState(entry?.content || "");

  if (!entry) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="font-mono text-xs text-muted-foreground">Entry not found in archive</p>
      </div>
    );
  }

  const linkedArtworks = store.getArtworks().filter((a) => entry.linkedArtworkIds.includes(a.id));

  const handleSave = () => {
    const updated = store.saveCodexEntry({ ...entry, title, content });
    setEntry(updated);
    setEditing(false);
  };

  const handleDelete = () => {
    store.deleteCodexEntry(entry.id);
    navigate("/codex");
  };

  return (
    <div className="px-8 py-10 max-w-4xl mx-auto space-y-10">
      <button
        onClick={() => navigate("/codex")}
        className="font-mono text-xs text-muted-foreground hover:text-foreground tracking-wide uppercase transition-colors"
      >
        ← Codex
      </button>

      <div>
        <div className="flex items-center gap-3 mb-2">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground border border-border px-2 py-0.5">
            {entry.type.toUpperCase()}
          </span>
          <span className="catalog-num">{new Date(entry.createdAt).toISOString().split("T")[0]}</span>
        </div>

        {editing ? (
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="text-3xl font-serif rounded-none border-b border-t-0 border-l-0 border-r-0 px-0" />
        ) : (
          <h1 className="text-3xl font-serif text-foreground mt-3">{entry.title}</h1>
        )}
      </div>

      <div className="flex gap-3">
        {editing ? (
          <Button variant="archive" size="sm" onClick={handleSave}>
            <Save className="h-3 w-3 mr-1.5" strokeWidth={1.5} /> Save
          </Button>
        ) : (
          <Button variant="archive" size="sm" onClick={() => setEditing(true)}>
            Edit Entry
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={handleDelete} className="text-destructive hover:text-destructive font-mono text-xs uppercase tracking-widest">
          <Trash2 className="h-3 w-3 mr-1.5" strokeWidth={1.5} /> Remove
        </Button>
      </div>

      {/* Content */}
      <div className="border border-border p-8">
        {editing ? (
          <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={20} className="font-mono text-xs leading-relaxed rounded-none border-0 resize-none p-0 focus-visible:ring-0" />
        ) : (
          <div className="font-mono text-xs leading-[1.8] text-foreground whitespace-pre-wrap">
            {entry.content}
          </div>
        )}
      </div>

      {/* Linked Artworks */}
      {linkedArtworks.length > 0 && (
        <div>
          <div className="mb-6">
            <span className="section-label">Linked Specimens — {linkedArtworks.length}</span>
            <div className="border-t border-border mt-2" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-border border border-border">
            {linkedArtworks.map((art, i) => (
              <ArtworkCard key={art.id} artwork={art} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

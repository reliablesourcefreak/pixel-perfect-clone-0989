import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { store } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2, Save } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArtworkCard } from "@/components/orbit/ArtworkCard";
import { motion } from "framer-motion";

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
        <p className="text-muted-foreground">Entry not found</p>
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
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate("/codex")} className="text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> Codex
      </Button>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="flex items-start justify-between">
          {editing ? (
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="text-2xl font-display font-bold" />
          ) : (
            <h1 className="text-2xl font-display font-bold text-foreground">{entry.title}</h1>
          )}
          <Badge className="shrink-0 capitalize">{entry.type}</Badge>
        </div>

        <div className="flex gap-2">
          {editing ? (
            <Button size="sm" onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Save className="h-3.5 w-3.5 mr-1" /> Save
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              Edit
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={handleDelete} className="text-destructive hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
          </Button>
        </div>

        {/* Content */}
        <div className="rounded-xl border bg-card p-6 shadow-card">
          {editing ? (
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={16} className="font-body text-sm" />
          ) : (
            <div className="prose prose-sm max-w-none font-body text-card-foreground whitespace-pre-wrap">
              {entry.content}
            </div>
          )}
        </div>

        {/* Linked Artworks */}
        {linkedArtworks.length > 0 && (
          <div>
            <h3 className="text-xs font-body font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Linked Artworks ({linkedArtworks.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {linkedArtworks.map((art, i) => (
                <ArtworkCard key={art.id} artwork={art} delay={i * 0.04} />
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

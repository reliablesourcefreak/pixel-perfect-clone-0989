import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { store } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  in_progress: "bg-accent/10 text-accent",
  completed: "bg-primary/10 text-primary",
  published: "bg-secondary/10 text-secondary-foreground",
};

export default function StoryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [story] = useState(() => store.getStory(id || ""));

  if (!story) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Story not found</p>
      </div>
    );
  }

  const handleDelete = () => {
    store.deleteStory(story.id);
    navigate("/stories");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate("/stories")} className="text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> Stories
      </Button>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="flex items-start justify-between">
          <h1 className="text-3xl font-display font-bold text-foreground">{story.title}</h1>
          <Badge className={`capitalize ${statusStyles[story.status]}`}>{story.status.replace("_", " ")}</Badge>
        </div>

        <p className="text-muted-foreground font-body max-w-2xl">{story.description}</p>

        <div className="flex items-center gap-4 text-sm text-muted-foreground font-body">
          <span>{story.scenes.length} scenes</span>
          <span>•</span>
          <span>Updated {new Date(story.updatedAt).toLocaleDateString()}</span>
        </div>

        <Button size="sm" variant="outline" onClick={handleDelete} className="text-destructive hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete Story
        </Button>

        {/* Scenes */}
        <div className="space-y-4 mt-8">
          <h3 className="text-xs font-body font-semibold uppercase tracking-wider text-muted-foreground">
            Story Outline
          </h3>
          <div className="relative border-l-2 border-border ml-4 space-y-6">
            {story.scenes.map((scene, i) => {
              const artwork = scene.artworkId ? store.getArtwork(scene.artworkId) : undefined;
              const codex = scene.codexEntryId ? store.getCodexEntry(scene.codexEntryId) : undefined;

              return (
                <motion.div
                  key={scene.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="relative pl-8"
                >
                  {/* Timeline dot */}
                  <div className="absolute left-0 top-1 -translate-x-[calc(50%+1px)] h-3 w-3 rounded-full bg-primary border-2 border-background" />
                  
                  <div className="rounded-xl border bg-card p-4 shadow-card">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground font-body">Scene {scene.sceneNumber}</span>
                    </div>
                    <h4 className="font-display text-base font-semibold text-card-foreground">{scene.title}</h4>
                    <p className="mt-1 text-sm text-muted-foreground font-body">{scene.description}</p>

                    {(artwork || codex) && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {artwork && (
                          <div className="flex items-center gap-2 rounded-lg border p-2">
                            <img src={artwork.imageUrl} alt={artwork.title} className="h-10 w-10 rounded object-cover" />
                            <span className="text-xs font-body text-card-foreground">{artwork.title}</span>
                          </div>
                        )}
                        {codex && (
                          <div className="flex items-center gap-2 rounded-lg border p-2">
                            <span className="text-xs">📖</span>
                            <span className="text-xs font-body text-card-foreground">{codex.title}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

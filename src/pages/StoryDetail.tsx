import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { store } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

const statusLabel: Record<string, string> = {
  draft: "DRAFT",
  in_progress: "IN PROGRESS",
  completed: "COMPLETED",
  published: "PUBLISHED",
};

export default function StoryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [story] = useState(() => store.getStory(id || ""));

  if (!story) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="font-mono text-xs text-muted-foreground">Narrative not found</p>
      </div>
    );
  }

  const handleDelete = () => {
    store.deleteStory(story.id);
    navigate("/stories");
  };

  const storyIndex = store.getStories().findIndex((s) => s.id === id);

  return (
    <div className="px-8 py-10 max-w-4xl mx-auto space-y-10">
      <button
        onClick={() => navigate("/stories")}
        className="font-mono text-xs text-muted-foreground hover:text-foreground tracking-wide uppercase transition-colors"
      >
        ← Stories
      </button>

      <div>
        <div className="flex items-center gap-3 mb-3">
          <span className="catalog-num">NAR-{String(storyIndex + 1).padStart(3, "0")}</span>
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground border border-border px-2 py-0.5">
            {statusLabel[story.status]}
          </span>
        </div>
        <h1 className="text-4xl font-serif text-foreground italic">{story.title}</h1>
        <p className="font-mono text-xs text-muted-foreground mt-3 tracking-wide leading-relaxed max-w-xl">
          {story.description}
        </p>
      </div>

      {/* Metadata */}
      <div className="border border-border">
        <table className="w-full font-mono text-xs">
          <tbody>
            <tr className="border-b border-border">
              <td className="p-3 text-muted-foreground tracking-widest uppercase w-40">Scenes</td>
              <td className="p-3 text-foreground">{story.scenes.length}</td>
            </tr>
            <tr className="border-b border-border">
              <td className="p-3 text-muted-foreground tracking-widest uppercase">Status</td>
              <td className="p-3 text-foreground">{statusLabel[story.status]}</td>
            </tr>
            <tr>
              <td className="p-3 text-muted-foreground tracking-widest uppercase">Last Updated</td>
              <td className="p-3 text-foreground">{new Date(story.updatedAt).toISOString().split("T")[0]}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <Button variant="ghost" size="sm" onClick={handleDelete} className="text-destructive hover:text-destructive font-mono text-xs uppercase tracking-widest">
        <Trash2 className="h-3 w-3 mr-1.5" strokeWidth={1.5} /> Remove Narrative
      </Button>

      {/* Scene outline */}
      <div>
        <div className="mb-6">
          <span className="section-label">Scene Outline</span>
          <div className="border-t border-border mt-2" />
        </div>

        <div className="border-l border-border ml-3 space-y-0">
          {story.scenes.map((scene, i) => {
            const artwork = scene.artworkId ? store.getArtwork(scene.artworkId) : undefined;
            const codex = scene.codexEntryId ? store.getCodexEntry(scene.codexEntryId) : undefined;

            return (
              <div key={scene.id} className="relative pl-8 pb-8 last:pb-0">
                {/* Dot */}
                <div className="absolute left-0 top-0 -translate-x-[calc(50%+0.5px)] h-2 w-2 border border-foreground bg-background" />

                <div className="border border-border p-5">
                  <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                    Scene {scene.sceneNumber}
                  </span>
                  <h4 className="font-serif text-base text-foreground mt-1">{scene.title}</h4>
                  <p className="font-mono text-xs text-muted-foreground mt-2 leading-relaxed">
                    {scene.description}
                  </p>

                  {(artwork || codex) && (
                    <div className="mt-4 border-t border-border pt-3 flex flex-wrap gap-4">
                      {artwork && (
                        <div className="flex items-center gap-3">
                          <img src={artwork.imageUrl} alt={artwork.title} className="h-12 w-12 object-cover border border-border" />
                          <div>
                            <span className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">Artwork</span>
                            <p className="font-mono text-xs text-foreground">{artwork.title}</p>
                          </div>
                        </div>
                      )}
                      {codex && (
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 border border-border flex items-center justify-center">
                            <span className="font-mono text-[10px] text-muted-foreground">CDX</span>
                          </div>
                          <div>
                            <span className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">Codex</span>
                            <p className="font-mono text-xs text-foreground">{codex.title}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, Loader2, Sparkles, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const statusLabel: Record<string, string> = {
  draft: "DRAFT",
  in_progress: "IN PROGRESS",
  completed: "COMPLETED",
  published: "PUBLISHED",
};

interface StoryData {
  id: string;
  title: string;
  description: string;
  status: string;
  ai_summary: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface SceneData {
  id: string;
  scene_number: number;
  title: string;
  description: string;
  artwork_id: string | null;
  codex_entry_id: string | null;
  artwork?: { id: string; title: string; image_url: string } | null;
  codex?: { id: string; title: string; type: string } | null;
}

export default function StoryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [story, setStory] = useState<StoryData | null>(null);
  const [scenes, setScenes] = useState<SceneData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("draft");
  const [summarizing, setSummarizing] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    const [{ data: row }, { data: sceneRows }] = await Promise.all([
      supabase.from("stories").select("*").eq("id", id).single(),
      supabase.from("story_scenes")
        .select("*, artworks(id, title, image_url), codex_entries(id, title, type)")
        .eq("story_id", id)
        .order("scene_number", { ascending: true }),
    ]);
    if (!row) { setLoading(false); return; }
    setStory(row as StoryData);
    setTitle(row.title);
    setDescription(row.description);
    setStatus(row.status);
    setScenes((sceneRows || []).map(s => ({
      ...s,
      artwork: (s as any).artworks || null,
      codex: (s as any).codex_entries || null,
    })));
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [id]);

  const isOwner = user?.id === story?.user_id;

  const handleSave = async () => {
    if (!story) return;
    await supabase.from("stories").update({ title, description, status }).eq("id", story.id);
    setStory({ ...story, title, description, status });
    setEditing(false);
    toast({ title: "Story updated" });
  };

  const handleDelete = async () => {
    if (!story || !confirm("Delete this story and all its scenes?")) return;
    await supabase.from("stories").delete().eq("id", story.id);
    toast({ title: "Story deleted" });
    navigate("/stories");
  };

  const addScene = async () => {
    if (!id) return;
    const nextNum = scenes.length + 1;
    const { data, error } = await supabase.from("story_scenes").insert({
      story_id: id, scene_number: nextNum, title: `Scene ${nextNum}`, description: "",
    }).select().single();
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    if (data) setScenes(prev => [...prev, { ...data, artwork: null, codex: null }]);
    toast({ title: "Scene added" });
  };

  const deleteScene = async (sceneId: string) => {
    await supabase.from("story_scenes").delete().eq("id", sceneId);
    setScenes(prev => prev.filter(s => s.id !== sceneId));
    toast({ title: "Scene removed" });
  };

  const handleAiSummary = async () => {
    if (!story) return;
    setSummarizing(true);
    try {
      const sceneText = scenes.map(s => `Scene ${s.scene_number}: ${s.title} - ${s.description}`).join("\n");
      const res = await supabase.functions.invoke("analyze-artwork", {
        body: {
          mode: "story-summary",
          title: story.title,
          description: story.description,
          scenes: sceneText,
        },
      });
      const summary = res.data?.summary;
      if (summary) {
        await supabase.from("stories").update({ ai_summary: summary }).eq("id", story.id);
        setStory({ ...story, ai_summary: summary });
        toast({ title: "AI summary generated" });
      }
    } catch {
      toast({ title: "Could not generate summary", variant: "destructive" });
    }
    setSummarizing(false);
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  if (!story) return <div className="flex items-center justify-center min-h-[60vh]"><p className="font-mono text-xs text-muted-foreground">Narrative not found</p></div>;

  return (
    <div className="px-8 py-10 max-w-4xl mx-auto space-y-10">
      <button onClick={() => navigate("/stories")} className="font-mono text-xs text-muted-foreground hover:text-foreground tracking-wide uppercase transition-colors">
        ← Stories
      </button>

      <div>
        <div className="flex items-center gap-3 mb-3">
          <span className="catalog-num">Narrative</span>
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground border border-border px-2 py-0.5">
            {statusLabel[story.status] || story.status.toUpperCase()}
          </span>
        </div>
        {editing ? (
          <div className="space-y-3">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="text-4xl font-serif rounded-none border-b border-t-0 border-l-0 border-r-0 px-0 italic" />
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-none font-mono text-xs" rows={3} />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="rounded-none w-48"><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : (
          <>
            <h1 className="text-4xl font-serif text-foreground italic">{story.title}</h1>
            <p className="font-mono text-xs text-muted-foreground mt-3 tracking-wide leading-relaxed max-w-xl">
              {story.description}
            </p>
          </>
        )}
      </div>

      {/* AI Summary */}
      {story.ai_summary && (
        <div className="border border-accent/30 bg-accent/5 p-5">
          <span className="font-mono text-[10px] tracking-widest uppercase text-accent">AI Summary</span>
          <p className="font-mono text-xs text-foreground mt-2 leading-relaxed">{story.ai_summary}</p>
        </div>
      )}

      {/* Actions */}
      {isOwner && (
        <div className="flex gap-3 flex-wrap">
          {editing ? (
            <Button variant="archive" size="sm" onClick={handleSave}>
              <Save className="h-3 w-3 mr-1.5" strokeWidth={1.5} /> Save
            </Button>
          ) : (
            <Button variant="archive" size="sm" onClick={() => setEditing(true)}>
              Edit Story
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={addScene} className="font-mono text-xs">
            <Plus className="h-3 w-3 mr-1.5" strokeWidth={1.5} /> Add Scene
          </Button>
          <Button variant="outline" size="sm" onClick={handleAiSummary} disabled={summarizing} className="font-mono text-xs">
            <Sparkles className="h-3 w-3 mr-1.5" strokeWidth={1.5} /> {summarizing ? "Analyzing…" : "AI Summary"}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDelete} className="text-destructive hover:text-destructive font-mono text-xs uppercase tracking-widest">
            <Trash2 className="h-3 w-3 mr-1.5" strokeWidth={1.5} /> Remove Narrative
          </Button>
        </div>
      )}

      {/* Metadata */}
      <div className="border border-border">
        <table className="w-full font-mono text-xs">
          <tbody>
            <tr className="border-b border-border">
              <td className="p-3 text-muted-foreground tracking-widest uppercase w-40">Scenes</td>
              <td className="p-3 text-foreground">{scenes.length}</td>
            </tr>
            <tr className="border-b border-border">
              <td className="p-3 text-muted-foreground tracking-widest uppercase">Status</td>
              <td className="p-3 text-foreground">{statusLabel[story.status] || story.status}</td>
            </tr>
            <tr>
              <td className="p-3 text-muted-foreground tracking-widest uppercase">Last Updated</td>
              <td className="p-3 text-foreground">{new Date(story.updated_at).toISOString().split("T")[0]}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Scene outline */}
      <div>
        <span className="section-label">Scene Outline</span>
        <div className="border-t border-border mt-2 mb-6" />

        {scenes.length === 0 ? (
          <div className="border border-border p-16 text-center">
            <p className="font-mono text-xs text-muted-foreground tracking-wide">
              No scenes yet. Add scenes to build your narrative structure.
            </p>
          </div>
        ) : (
          <div className="border-l border-border ml-3 space-y-0">
            {scenes.map((scene) => (
              <div key={scene.id} className="relative pl-8 pb-8 last:pb-0 group">
                <div className="absolute left-0 top-0 -translate-x-[calc(50%+0.5px)] h-2 w-2 border border-foreground bg-background" />

                <div className="border border-border p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                        Scene {scene.scene_number}
                      </span>
                      <h4 className="font-serif text-base text-foreground mt-1">{scene.title}</h4>
                      <p className="font-mono text-xs text-muted-foreground mt-2 leading-relaxed">
                        {scene.description}
                      </p>
                    </div>
                    {isOwner && (
                      <button onClick={() => deleteScene(scene.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive ml-4">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  {(scene.artwork || scene.codex) && (
                    <div className="mt-4 border-t border-border pt-3 flex flex-wrap gap-4">
                      {scene.artwork && (
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/gallery/${scene.artwork!.id}`)}>
                          <img src={scene.artwork.image_url} alt={scene.artwork.title} className="h-12 w-12 object-cover border border-border" />
                          <div>
                            <span className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">Artwork</span>
                            <p className="font-mono text-xs text-foreground">{scene.artwork.title}</p>
                          </div>
                        </div>
                      )}
                      {scene.codex && (
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/codex/${scene.codex!.id}`)}>
                          <div className="h-12 w-12 border border-border flex items-center justify-center">
                            <span className="font-mono text-[10px] text-muted-foreground">CDX</span>
                          </div>
                          <div>
                            <span className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">Codex</span>
                            <p className="font-mono text-xs text-foreground">{scene.codex.title}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

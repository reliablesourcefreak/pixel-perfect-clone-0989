import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, BookText } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { StoriesListSkeleton } from "@/components/orbit/GallerySkeletons";

const statusLabel: Record<string, string> = {
  draft: "DRAFT",
  in_progress: "IN PROGRESS",
  completed: "COMPLETED",
  published: "PUBLISHED",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "hsl(45, 70%, 50%)",
  in_progress: "hsl(210, 80%, 55%)",
  completed: "hsl(160, 60%, 45%)",
  published: "hsl(280, 65%, 55%)",
};

interface StoryRow {
  id: string;
  title: string;
  description: string;
  status: string;
  ai_summary: string | null;
  created_at: string;
  updated_at: string;
  scene_count: number;
}

export default function Stories() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stories, setStories] = useState<StoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const fetchStories = async () => {
    setLoading(true);
    const { data: rows } = await supabase
      .from("stories")
      .select("*")
      .order("updated_at", { ascending: false });

    if (!rows) { setLoading(false); return; }

    const ids = rows.map(r => r.id);
    const { data: scenes } = await supabase
      .from("story_scenes")
      .select("story_id")
      .in("story_id", ids.length > 0 ? ids : ["_"]);

    const enriched: StoryRow[] = rows.map(r => ({
      ...r,
      scene_count: (scenes || []).filter(s => s.story_id === r.id).length,
    }));

    setStories(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchStories(); }, []);

  const handleCreate = async () => {
    if (!user || !title.trim()) return;
    const { error } = await supabase.from("stories").insert({
      user_id: user.id, title: title.trim(), description: description.trim(),
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setTitle(""); setDescription(""); setOpen(false);
    toast({ title: "Narrative registered" });
    fetchStories();
  };

  return (
    <div className="px-8 py-10 max-w-6xl mx-auto">
      <div className="flex items-end justify-between mb-8">
        <div>
          <span className="catalog-num">Catalogue Section — Narratives</span>
          <h1 className="font-serif text-3xl mt-2 text-foreground">Stories</h1>
          <p className="font-mono text-xs text-muted-foreground mt-2 tracking-wide">
            {stories.length} narrative thread{stories.length !== 1 ? "s" : ""} in archive
          </p>
        </div>
        {user && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="archive" size="sm">
                <Plus className="h-3 w-3 mr-1.5" strokeWidth={1.5} />
                New Story
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-none border-foreground">
              <DialogHeader>
                <DialogTitle className="font-serif text-xl">Register Narrative</DialogTitle>
              </DialogHeader>
              <div className="space-y-5 mt-4">
                <div>
                  <Label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Narrative title" className="mt-1.5 rounded-none" />
                </div>
                <div>
                  <Label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Synopsis</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief summary" className="mt-1.5 rounded-none" />
                </div>
                <Button onClick={handleCreate} variant="archive" className="w-full">
                  Register Narrative
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="border-t border-border mb-8" />

      {loading ? (
        <StoriesListSkeleton />
      ) : stories.length === 0 ? (
        <div className="border border-border p-16 text-center space-y-3">
          <BookText className="h-8 w-8 text-muted-foreground mx-auto" strokeWidth={1} />
          <p className="font-mono text-xs text-muted-foreground tracking-wide">
            No narratives yet. Create one to start building your stories.
          </p>
        </div>
      ) : (
        <div className="border border-border divide-y divide-border">
          {stories.map((story, i) => (
            <div
              key={story.id}
              onClick={() => navigate(`/stories/${story.id}`)}
              className="cursor-pointer p-6 hover:bg-secondary transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="catalog-num">NAR-{String(i + 1).padStart(3, "0")}</span>
                    <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground border border-border px-2 py-0.5 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[story.status] || "hsl(0,0%,50%)" }} />
                      {statusLabel[story.status] || story.status.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="font-serif text-xl text-foreground italic">{story.title}</h3>
                  {story.ai_summary ? (
                    <p className="mt-2 font-mono text-xs text-muted-foreground leading-relaxed max-w-lg italic">
                      AI: {story.ai_summary}
                    </p>
                  ) : (
                    <p className="mt-2 font-mono text-xs text-muted-foreground leading-relaxed max-w-lg">
                      {story.description}
                    </p>
                  )}
                </div>
                <div className="text-right font-mono text-[10px] text-muted-foreground tracking-wide shrink-0 ml-6 space-y-1">
                  <p>{story.scene_count} scene{story.scene_count !== 1 ? "s" : ""}</p>
                  <p>{new Date(story.updated_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

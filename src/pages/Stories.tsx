import { useState } from "react";
import { store } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";

const statusLabel: Record<string, string> = {
  draft: "DRAFT",
  in_progress: "IN PROGRESS",
  completed: "COMPLETED",
  published: "PUBLISHED",
};

export default function Stories() {
  const [stories, setStories] = useState(() => store.getStories());
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const navigate = useNavigate();

  const handleCreate = () => {
    if (!title.trim()) return;
    store.saveStory({ title, description });
    setStories(store.getStories());
    setTitle("");
    setDescription("");
    setOpen(false);
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
      </div>

      <div className="border-t border-border mb-8" />

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
                  <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground border border-border px-2 py-0.5">
                    {statusLabel[story.status]}
                  </span>
                </div>
                <h3 className="font-serif text-xl text-foreground italic">{story.title}</h3>
                <p className="mt-2 font-mono text-xs text-muted-foreground leading-relaxed max-w-lg">
                  {story.description}
                </p>
              </div>
              <div className="text-right font-mono text-[10px] text-muted-foreground tracking-wide shrink-0 ml-6 space-y-1">
                <p>{story.scenes.length} scene{story.scenes.length !== 1 ? "s" : ""}</p>
                <p>{new Date(story.updatedAt).toISOString().split("T")[0]}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useState } from "react";
import { store, Story } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Plus, BookText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
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

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  in_progress: "bg-accent/10 text-accent",
  completed: "bg-primary/10 text-primary",
  published: "bg-secondary/10 text-secondary-foreground",
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
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <motion.h3
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs font-body font-semibold uppercase tracking-wider text-muted-foreground"
        >
          Stories ({stories.length})
        </motion.h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-3.5 w-3.5" />
              New Story
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Create Story</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label className="font-body text-sm">Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. The Exodus" />
              </div>
              <div>
                <Label className="font-body text-sm">Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this story about?" />
              </div>
              <Button onClick={handleCreate} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {stories.map((story, i) => (
          <motion.div
            key={story.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => navigate(`/stories/${story.id}`)}
            className="cursor-pointer rounded-xl border bg-card p-5 shadow-card hover:shadow-card-hover transition-all duration-300"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <BookText className="h-5 w-5 text-primary" />
                <h4 className="font-display text-lg font-semibold text-card-foreground">{story.title}</h4>
              </div>
              <Badge className={`text-xs capitalize ${statusStyles[story.status]}`}>
                {story.status.replace("_", " ")}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground font-body line-clamp-2">{story.description}</p>
            <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground font-body">
              <span>{story.scenes.length} scene{story.scenes.length !== 1 ? "s" : ""}</span>
              <span>•</span>
              <span>{new Date(story.updatedAt).toLocaleDateString()}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

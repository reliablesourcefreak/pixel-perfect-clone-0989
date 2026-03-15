import { useState } from "react";
import { store, CodexEntry } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Plus, User, Globe, Lightbulb, Wrench, BookOpen, MoreHorizontal } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";

const typeIcons: Record<string, typeof User> = {
  character: User,
  world: Globe,
  concept: Lightbulb,
  technique: Wrench,
  reference: BookOpen,
  other: MoreHorizontal,
};

const typeColors: Record<string, string> = {
  character: "bg-accent/10 text-accent",
  world: "bg-primary/10 text-primary",
  concept: "bg-secondary/10 text-secondary-foreground",
  technique: "bg-muted text-muted-foreground",
  reference: "bg-primary/5 text-primary",
  other: "bg-muted text-muted-foreground",
};

export default function Codex() {
  const [entries, setEntries] = useState(() => store.getCodexEntries());
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<CodexEntry["type"]>("character");
  const [content, setContent] = useState("");
  const navigate = useNavigate();

  const handleCreate = () => {
    if (!title.trim()) return;
    store.saveCodexEntry({ title, type, content });
    setEntries(store.getCodexEntries());
    setTitle("");
    setContent("");
    setOpen(false);
  };

  const grouped = entries.reduce<Record<string, CodexEntry[]>>((acc, e) => {
    (acc[e.type] = acc[e.type] || []).push(e);
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <motion.h3
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs font-body font-semibold uppercase tracking-wider text-muted-foreground"
        >
          Knowledge Base ({entries.length} entries)
        </motion.h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-3.5 w-3.5" />
              New Entry
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Create Codex Entry</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label className="font-body text-sm">Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Aria" />
              </div>
              <div>
                <Label className="font-body text-sm">Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as CodexEntry["type"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="character">Character</SelectItem>
                    <SelectItem value="world">World</SelectItem>
                    <SelectItem value="concept">Concept</SelectItem>
                    <SelectItem value="technique">Technique</SelectItem>
                    <SelectItem value="reference">Reference</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-body text-sm">Content (Markdown)</Label>
                <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write about this entry…" rows={6} />
              </div>
              <Button onClick={handleCreate} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {Object.entries(grouped).map(([typeName, typeEntries], gi) => {
        const Icon = typeIcons[typeName] || MoreHorizontal;
        return (
          <motion.section
            key={typeName}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: gi * 0.05 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-body font-semibold capitalize text-foreground">{typeName}s</h4>
              <Badge variant="secondary" className="text-xs">{typeEntries.length}</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {typeEntries.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: gi * 0.05 + i * 0.03 }}
                  onClick={() => navigate(`/codex/${entry.id}`)}
                  className="cursor-pointer rounded-xl border bg-card p-4 shadow-card hover:shadow-card-hover transition-all duration-300"
                >
                  <div className="flex items-start justify-between">
                    <h5 className="font-display text-sm font-semibold text-card-foreground">{entry.title}</h5>
                    <Badge className={`text-[10px] ${typeColors[entry.type]}`}>{entry.type}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground line-clamp-3 font-body">
                    {entry.content.replace(/[#*\[\]]/g, "").slice(0, 150)}…
                  </p>
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{entry.linkedArtworkIds.length} artworks</span>
                    <span>{entry.linkedStoryIds.length} stories</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        );
      })}
    </div>
  );
}

import { useState } from "react";
import { store, CodexEntry } from "@/lib/store";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";

const typeLabels: Record<string, string> = {
  character: "CHAR",
  world: "WRLD",
  concept: "CNPT",
  technique: "TECH",
  reference: "REF",
  other: "MISC",
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
    <div className="px-8 py-10 max-w-6xl mx-auto">
      <div className="flex items-end justify-between mb-8">
        <div>
          <span className="catalog-num">Catalogue Section — Knowledge Base</span>
          <h1 className="font-serif text-3xl mt-2 text-foreground">Codex</h1>
          <p className="font-mono text-xs text-muted-foreground mt-2 tracking-wide">
            {entries.length} registered entries across {Object.keys(grouped).length} categories
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="archive" size="sm">
              <Plus className="h-3 w-3 mr-1.5" strokeWidth={1.5} />
              New Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-none border-foreground">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Register Codex Entry</DialogTitle>
            </DialogHeader>
            <div className="space-y-5 mt-4">
              <div>
                <Label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Entry designation" className="mt-1.5 rounded-none" />
              </div>
              <div>
                <Label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Classification</Label>
                <Select value={type} onValueChange={(v) => setType(v as CodexEntry["type"])}>
                  <SelectTrigger className="rounded-none mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-none">
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
                <Label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Content</Label>
                <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Documentation…" rows={6} className="mt-1.5 rounded-none font-mono text-xs" />
              </div>
              <Button onClick={handleCreate} variant="archive" className="w-full">
                Register Entry
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border-t border-border mb-10" />

      {Object.entries(grouped).map(([typeName, typeEntries], gi) => (
        <section key={typeName} className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground border border-border px-2 py-0.5">
              {typeLabels[typeName] || "MISC"}
            </span>
            <span className="section-label capitalize">{typeName}s — {typeEntries.length}</span>
          </div>

          <div className="border border-border divide-y divide-border">
            {typeEntries.map((entry, i) => (
              <div
                key={entry.id}
                onClick={() => navigate(`/codex/${entry.id}`)}
                className="cursor-pointer p-5 hover:bg-secondary transition-colors group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="catalog-num">{typeLabels[entry.type]}-{String(i + 1).padStart(3, "0")}</span>
                      <h4 className="font-serif text-base text-foreground">{entry.title}</h4>
                    </div>
                    <p className="mt-2 font-mono text-xs text-muted-foreground line-clamp-2 leading-relaxed max-w-xl">
                      {entry.content.replace(/[#*\[\]]/g, "").slice(0, 180)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 font-mono text-[10px] text-muted-foreground tracking-wide shrink-0 ml-6">
                    <span>{entry.linkedArtworkIds.length} works</span>
                    <span>{entry.linkedStoryIds.length} stories</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

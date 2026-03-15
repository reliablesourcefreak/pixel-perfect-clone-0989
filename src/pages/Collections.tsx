import { useMemo, useState } from "react";
import { store, Collection } from "@/lib/store";
import { CollectionCard } from "@/components/orbit/CollectionCard";
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
import { motion } from "framer-motion";

export default function Collections() {
  const [collections, setCollections] = useState(() => store.getCollections());
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#2D1B69");

  const handleCreate = () => {
    if (!name.trim()) return;
    store.saveCollection({ name, description, color });
    setCollections(store.getCollections());
    setName("");
    setDescription("");
    setColor("#2D1B69");
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
          All Collections ({collections.length})
        </motion.h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-3.5 w-3.5" />
              New Collection
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Create Collection</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label className="font-body text-sm">Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Character Studies" />
              </div>
              <div>
                <Label className="font-body text-sm">Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this collection about?" />
              </div>
              <div>
                <Label className="font-body text-sm">Color</Label>
                <div className="flex gap-2 mt-1">
                  {["#2D1B69", "#FF6B4A", "#8B9E7D", "#6B4AFF", "#E84855", "#2D936C"].map((c) => (
                    <button
                      key={c}
                      className={`h-8 w-8 rounded-full border-2 transition-transform ${color === c ? "border-foreground scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setColor(c)}
                    />
                  ))}
                </div>
              </div>
              <Button onClick={handleCreate} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {collections.map((col, i) => (
          <CollectionCard
            key={col.id}
            collection={col}
            artworkCount={store.getArtworksByCollection(col.id).length}
            delay={i * 0.04}
          />
        ))}
      </div>
    </div>
  );
}

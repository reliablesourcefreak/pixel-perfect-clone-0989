import { useState } from "react";
import { store } from "@/lib/store";
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

export default function Collections() {
  const [collections, setCollections] = useState(() => store.getCollections());
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = () => {
    if (!name.trim()) return;
    store.saveCollection({ name, description });
    setCollections(store.getCollections());
    setName("");
    setDescription("");
    setOpen(false);
  };

  return (
    <div className="px-8 py-10 max-w-6xl mx-auto">
      <div className="flex items-end justify-between mb-8">
        <div>
          <span className="catalog-num">Catalogue Section — Collections</span>
          <h1 className="font-serif text-3xl mt-2 text-foreground">Collections</h1>
          <p className="font-mono text-xs text-muted-foreground mt-2 tracking-wide">
            {collections.length} registered collection{collections.length !== 1 ? "s" : ""} in archive
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="archive" size="sm">
              <Plus className="h-3 w-3 mr-1.5" strokeWidth={1.5} />
              New Collection
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-none border-foreground">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Register New Collection</DialogTitle>
            </DialogHeader>
            <div className="space-y-5 mt-4">
              <div>
                <Label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Designation</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Collection name" className="mt-1.5 rounded-none" />
              </div>
              <div>
                <Label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Purpose and scope" className="mt-1.5 rounded-none" />
              </div>
              <Button onClick={handleCreate} variant="archive" className="w-full">
                Register Collection
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border-t border-border mb-8" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
        {collections.map((col, i) => (
          <CollectionCard
            key={col.id}
            collection={col}
            artworkCount={store.getArtworksByCollection(col.id).length}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, FolderPlus, Tag, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface BulkToolbarProps {
  selectedIds: string[];
  collections: { id: string; name: string; color: string }[];
  onClear: () => void;
  onActionComplete: () => void;
}

export function BulkToolbar({ selectedIds, collections, onClear, onActionComplete }: BulkToolbarProps) {
  const [tagInput, setTagInput] = useState("");
  const count = selectedIds.length;

  const batchAddToCollection = async (collectionId: string) => {
    const inserts = selectedIds.map(id => ({ collection_id: collectionId, artwork_id: id }));
    const { error } = await supabase.from("collection_artworks").insert(inserts);
    if (error) {
      if (error.code === "23505") { toast({ title: "Some already in collection" }); }
      else { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    }
    toast({ title: `Added ${count} works to collection` });
    onClear();
  };

  const batchTag = async () => {
    const tag = tagInput.trim().toLowerCase();
    if (!tag) return;
    const inserts = selectedIds.map(id => ({ artwork_id: id, tag }));
    const { error } = await supabase.from("artwork_tags").insert(inserts);
    if (error && error.code !== "23505") {
      toast({ title: "Error", description: error.message, variant: "destructive" }); return;
    }
    toast({ title: `Tagged ${count} works with "${tag}"` });
    setTagInput("");
    onClear();
    onActionComplete();
  };

  const batchDelete = async () => {
    for (const id of selectedIds) {
      await supabase.from("artwork_tags").delete().eq("artwork_id", id);
      await supabase.from("artwork_categories").delete().eq("artwork_id", id);
      await supabase.from("artwork_analysis").delete().eq("artwork_id", id);
      await supabase.from("collection_artworks").delete().eq("artwork_id", id);
      await supabase.from("codex_artwork_links").delete().eq("artwork_id", id);
      await supabase.from("story_scenes").update({ artwork_id: null }).eq("artwork_id", id);
    }
    const { error } = await supabase.from("artworks").delete().in("id", selectedIds);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: `Deleted ${count} works` });
    onClear();
    onActionComplete();
  };

  if (count === 0) return null;

  return (
    <div className="sticky top-0 z-30 bg-foreground text-primary-foreground p-3 flex items-center gap-3 font-mono text-xs tracking-wide border-b border-border">
      <span className="font-medium">{count} selected</span>

      {/* Add to collection */}
      {collections.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button size="sm" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10 h-7 gap-1.5">
              <FolderPlus className="h-3 w-3" strokeWidth={1.5} /> Collection
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-0 rounded-none" align="start">
            <div className="divide-y divide-border">
              {collections.map(col => (
                <button
                  key={col.id}
                  onClick={() => batchAddToCollection(col.id)}
                  className="w-full flex items-center gap-2 p-2.5 font-mono text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  <span className="h-2 w-2 shrink-0" style={{ backgroundColor: col.color }} />
                  <span className="truncate">{col.name}</span>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Batch tag */}
      <Popover>
        <PopoverTrigger asChild>
          <Button size="sm" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10 h-7 gap-1.5">
            <Tag className="h-3 w-3" strokeWidth={1.5} /> Tag
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-3 rounded-none space-y-2" align="start">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Enter tag…"
            className="rounded-none h-7 text-xs"
            onKeyDown={(e) => e.key === "Enter" && batchTag()}
          />
          <Button size="sm" variant="archive" className="w-full h-7" onClick={batchTag}>
            Apply Tag
          </Button>
        </PopoverContent>
      </Popover>

      {/* Batch delete */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="sm" variant="ghost" className="text-red-400 hover:bg-red-500/10 h-7 gap-1.5">
            <Trash2 className="h-3 w-3" strokeWidth={1.5} /> Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">Delete {count} artwork{count !== 1 ? "s" : ""}?</AlertDialogTitle>
            <AlertDialogDescription className="font-mono text-xs">
              This will permanently remove the selected artworks and all associated analysis, tags, and categories.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none font-mono text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={batchDelete} className="rounded-none font-mono text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex-1" />
      <button onClick={onClear} className="hover:text-primary-foreground/70 transition-colors">
        <X className="h-3.5 w-3.5" strokeWidth={1.5} />
      </button>
    </div>
  );
}

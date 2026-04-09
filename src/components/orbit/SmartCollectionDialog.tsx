import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { X, Zap } from "lucide-react";

export interface SmartRule {
  tags?: string[];
  moods?: string[];
  styles?: string[];
  dateRange?: "7d" | "30d" | "90d" | "365d" | "all";
  analysisStatus?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    name: string;
    description: string;
    is_smart: boolean;
    smart_rules: SmartRule | null;
  }) => void;
}

const COMMON_MOODS = ["serene", "dark", "energetic", "melancholic", "mysterious", "joyful", "tense", "dreamlike"];
const COMMON_STYLES = ["impressionist", "abstract", "realist", "surreal", "minimalist", "expressionist", "digital", "photographic"];

export function SmartCollectionDialog({ open, onOpenChange, onSubmit }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSmart, setIsSmart] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [moods, setMoods] = useState<string[]>([]);
  const [styles, setStyles] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<string>("all");
  const [analysisStatus, setAnalysisStatus] = useState<string>("any");

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };

  const toggleItem = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    const rules: SmartRule | null = isSmart ? {
      tags: tags.length > 0 ? tags : undefined,
      moods: moods.length > 0 ? moods : undefined,
      styles: styles.length > 0 ? styles : undefined,
      dateRange: dateRange !== "all" ? dateRange as SmartRule["dateRange"] : undefined,
      analysisStatus: analysisStatus !== "any" ? analysisStatus : undefined,
    } : null;
    onSubmit({ name: name.trim(), description: description.trim(), is_smart: isSmart, smart_rules: rules });
    setName(""); setDescription(""); setIsSmart(false); setTags([]); setMoods([]); setStyles([]); setDateRange("all"); setAnalysisStatus("any");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none border-foreground max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Create Collection</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 mt-4">
          <div>
            <Label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Character Concepts" className="mt-1.5 rounded-none" />
          </div>
          <div>
            <Label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Purpose</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What is this board for?" className="mt-1.5 rounded-none" />
          </div>

          <div className="flex items-center justify-between border border-border p-4">
            <div className="flex items-center gap-3">
              <Zap className="h-4 w-4 text-primary" strokeWidth={1.5} />
              <div>
                <p className="font-mono text-xs text-foreground">Smart Collection</p>
                <p className="font-mono text-[10px] text-muted-foreground tracking-wide mt-0.5">Auto-curate artworks matching rules</p>
              </div>
            </div>
            <Switch checked={isSmart} onCheckedChange={setIsSmart} />
          </div>

          {isSmart && (
            <div className="space-y-4 border border-border p-4 bg-secondary/30">
              <span className="section-label">Smart Rules</span>

              {/* Tags */}
              <div>
                <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Match Tags</Label>
                <div className="flex gap-2 mt-1.5">
                  <Input
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())}
                    placeholder="Add tag…"
                    className="rounded-none flex-1"
                  />
                  <Button variant="outline" size="sm" onClick={addTag} className="font-mono text-xs rounded-none">Add</Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tags.map(t => (
                      <Badge key={t} variant="secondary" className="font-mono text-[10px] rounded-none gap-1">
                        {t}
                        <button onClick={() => setTags(tags.filter(x => x !== t))}><X className="h-2.5 w-2.5" /></button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Moods */}
              <div>
                <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Match Moods</Label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {COMMON_MOODS.map(m => (
                    <Badge
                      key={m}
                      variant={moods.includes(m) ? "default" : "outline"}
                      className="font-mono text-[10px] rounded-none cursor-pointer"
                      onClick={() => toggleItem(moods, setMoods, m)}
                    >
                      {m}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Styles */}
              <div>
                <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Match Styles</Label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {COMMON_STYLES.map(s => (
                    <Badge
                      key={s}
                      variant={styles.includes(s) ? "default" : "outline"}
                      className="font-mono text-[10px] rounded-none cursor-pointer"
                      onClick={() => toggleItem(styles, setStyles, s)}
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div>
                <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Date Range</Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="mt-1.5 rounded-none font-mono text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                    <SelectItem value="90d">Last 90 Days</SelectItem>
                    <SelectItem value="365d">Last Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Analysis Status */}
              <div>
                <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Analysis Status</Label>
                <Select value={analysisStatus} onValueChange={setAnalysisStatus}>
                  <SelectTrigger className="mt-1.5 rounded-none font-mono text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <Button onClick={handleSubmit} variant="archive" className="w-full">
            {isSmart ? "Create Smart Collection" : "Create Board"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Image, FolderOpen, BookOpen, BookText, Clock, Network,
  Download, Settings, Upload, LayoutDashboard, Search, Star,
} from "lucide-react";

interface SearchResult {
  id: string;
  title: string;
  type: "artwork" | "tag" | "category" | "page";
  subtitle?: string;
  url: string;
}

const PAGES = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Gallery", url: "/gallery", icon: Image },
  { title: "Collections", url: "/collections", icon: FolderOpen },
  { title: "Codex", url: "/codex", icon: BookOpen },
  { title: "Stories", url: "/stories", icon: BookText },
  { title: "Timeline", url: "/timeline", icon: Clock },
  { title: "Mindmap", url: "/mindmap", icon: Network },
  { title: "Exports", url: "/exports", icon: Download },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Upload Artwork", url: "/upload", icon: Upload },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const search = useCallback(async (q: string) => {
    setQuery(q);
    if (!q || q.length < 2) { setResults([]); return; }

    const lq = `%${q}%`;
    const [{ data: artworks }, { data: tags }, { data: cats }] = await Promise.all([
      supabase.from("artworks").select("id, title").ilike("title", lq).limit(8),
      supabase.from("artwork_tags").select("tag, artwork_id").ilike("tag", lq).limit(8),
      supabase.from("artwork_categories").select("category, artwork_id").ilike("category", lq).limit(8),
    ]);

    const r: SearchResult[] = [];
    (artworks || []).forEach(a => r.push({ id: a.id, title: a.title, type: "artwork", url: `/gallery/${a.id}` }));

    const seenTags = new Set<string>();
    (tags || []).forEach(t => {
      if (!seenTags.has(t.tag)) {
        seenTags.add(t.tag);
        r.push({ id: `tag-${t.tag}`, title: t.tag, type: "tag", subtitle: "Tag", url: `/gallery` });
      }
    });

    const seenCats = new Set<string>();
    (cats || []).forEach(c => {
      if (!seenCats.has(c.category)) {
        seenCats.add(c.category);
        r.push({ id: `cat-${c.category}`, title: c.category, type: "category", subtitle: "Category", url: `/gallery` });
      }
    });

    setResults(r);
  }, []);

  const handleSelect = (url: string) => {
    setOpen(false);
    setQuery("");
    setResults([]);
    navigate(url);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search artworks, tags, categories, pages…"
        value={query}
        onValueChange={search}
        className="font-mono text-xs"
      />
      <CommandList>
        <CommandEmpty className="font-mono text-xs text-muted-foreground py-6 text-center">
          No results found.
        </CommandEmpty>

        {results.length > 0 && (
          <CommandGroup heading="Results">
            {results.map((r) => (
              <CommandItem
                key={r.id}
                onSelect={() => handleSelect(r.url)}
                className="font-mono text-xs tracking-wide cursor-pointer"
              >
                {r.type === "artwork" && <Image className="mr-2 h-3 w-3" strokeWidth={1.5} />}
                {r.type === "tag" && <Star className="mr-2 h-3 w-3" strokeWidth={1.5} />}
                {r.type === "category" && <FolderOpen className="mr-2 h-3 w-3" strokeWidth={1.5} />}
                <span>{r.title}</span>
                {r.subtitle && (
                  <span className="ml-auto text-muted-foreground text-[10px]">{r.subtitle}</span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        <CommandGroup heading="Pages">
          {PAGES.filter(p => !query || p.title.toLowerCase().includes(query.toLowerCase())).map((page) => (
            <CommandItem
              key={page.url}
              onSelect={() => handleSelect(page.url)}
              className="font-mono text-xs tracking-wide cursor-pointer"
            >
              <page.icon className="mr-2 h-3 w-3" strokeWidth={1.5} />
              <span>{page.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

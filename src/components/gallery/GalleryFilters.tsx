import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface GalleryFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  categories: string[];
  categoryCounts: Map<string, number>;
  selectedCategory: string | null;
  onCategoryChange: (cat: string | null) => void;
  allTags: [string, number][];
  selectedTag: string | null;
  onTagChange: (tag: string | null) => void;
}

export function GalleryFilters({
  searchQuery, onSearchChange,
  categories, categoryCounts, selectedCategory, onCategoryChange,
  allTags, selectedTag, onTagChange,
}: GalleryFiltersProps) {
  return (
    <aside className="space-y-10">
      {/* Search */}
      <div>
        <span className="section-label">Search</span>
        <div className="mt-3 relative">
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Title, tag..."
            className="rounded-none pr-8"
          />
          <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
        </div>
      </div>

      {/* Categories */}
      <div>
        <span className="section-label">Categories</span>
        <div className="mt-3 border border-border divide-y divide-border">
          {categories.map((cat) => {
            const count = categoryCounts.get(cat) || 0;
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => onCategoryChange(isActive ? null : cat)}
                className={`w-full flex items-center justify-between p-3 font-mono text-[11px] tracking-wide transition-colors ${
                  isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 bg-accent inline-block" style={{ opacity: count > 0 ? 1 : 0.15 }} />
                  <span>{cat}</span>
                </div>
                <span>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tags */}
      {allTags.length > 0 && (
        <div>
          <span className="section-label">Tags</span>
          <div className="mt-3 flex flex-wrap gap-2">
            {allTags.map(([tag]) => (
              <button
                key={tag}
                onClick={() => onTagChange(selectedTag === tag ? null : tag)}
                className={`font-mono text-[11px] tracking-wide px-2.5 py-1 border transition-colors ${
                  selectedTag === tag
                    ? "bg-foreground text-primary-foreground border-foreground"
                    : "bg-transparent text-muted-foreground border-border hover:border-foreground hover:text-foreground"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

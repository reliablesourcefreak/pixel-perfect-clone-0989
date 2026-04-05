import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download, FileJson, FileText, Image, Rss, Loader2 } from "lucide-react";

interface ExportArtwork {
  id: string;
  title: string;
  image_url: string;
  analysis_status: string;
  created_at: string;
  width: number | null;
  height: number | null;
  file_size_bytes: number | null;
}

export default function Exports() {
  const [artworks, setArtworks] = useState<ExportArtwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    supabase
      .from("artworks")
      .select("id, title, image_url, analysis_status, created_at, width, height, file_size_bytes")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setArtworks(data || []);
        setLoading(false);
      });
  }, []);

  const exportJSON = async () => {
    setExporting("json");
    try {
      const ids = artworks.map(a => a.id);
      const [{ data: analyses }, { data: cats }, { data: tags }] = await Promise.all([
        supabase.from("artwork_analysis").select("*").in("artwork_id", ids),
        supabase.from("artwork_categories").select("*").in("artwork_id", ids),
        supabase.from("artwork_tags").select("*").in("artwork_id", ids),
      ]);

      const fullExport = artworks.map(art => ({
        ...art,
        analysis: (analyses || []).find(a => a.artwork_id === art.id) || null,
        categories: (cats || []).filter(c => c.artwork_id === art.id).map(c => ({ name: c.category, confidence: c.confidence })),
        tags: (tags || []).filter(t => t.artwork_id === art.id).map(t => t.tag),
      }));

      const blob = new Blob([JSON.stringify(fullExport, null, 2)], { type: "application/json" });
      downloadBlob(blob, `art-archive-${Date.now()}.json`);
      toast("Exported", { description: `${artworks.length} artworks exported as JSON.` });
    } catch (err: any) {
      toast.error("Export failed", { description: err.message });
    }
    setExporting(null);
  };

  const exportCSV = async () => {
    setExporting("csv");
    try {
      const ids = artworks.map(a => a.id);
      const [{ data: cats }, { data: tags }] = await Promise.all([
        supabase.from("artwork_categories").select("artwork_id, category, confidence").in("artwork_id", ids),
        supabase.from("artwork_tags").select("artwork_id, tag").in("artwork_id", ids),
      ]);

      const rows = artworks.map(art => {
        const artCats = (cats || []).filter(c => c.artwork_id === art.id).map(c => c.category).join("; ");
        const artTags = (tags || []).filter(t => t.artwork_id === art.id).map(t => t.tag).join("; ");
        return [
          art.id, `"${art.title.replace(/"/g, '""')}"`, art.image_url, art.analysis_status,
          art.created_at, art.width || "", art.height || "", art.file_size_bytes || "",
          `"${artCats}"`, `"${artTags}"`
        ].join(",");
      });

      const csv = ["id,title,image_url,status,created_at,width,height,file_size,categories,tags", ...rows].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      downloadBlob(blob, `art-archive-${Date.now()}.csv`);
      toast("Exported", { description: `${artworks.length} artworks exported as CSV.` });
    } catch (err: any) {
      toast.error("Export failed", { description: err.message });
    }
    setExporting(null);
  };

  const exportMarkdown = async () => {
    setExporting("md");
    try {
      const ids = artworks.map(a => a.id);
      const [{ data: analyses }, { data: cats }, { data: tags }] = await Promise.all([
        supabase.from("artwork_analysis").select("*").in("artwork_id", ids),
        supabase.from("artwork_categories").select("artwork_id, category").in("artwork_id", ids),
        supabase.from("artwork_tags").select("artwork_id, tag").in("artwork_id", ids),
      ]);

      let md = `# Art Archive\n\n> Exported ${new Date().toLocaleDateString()} · ${artworks.length} works\n\n---\n\n`;

      artworks.forEach((art, i) => {
        const analysis = (analyses || []).find(a => a.artwork_id === art.id);
        const artCats = (cats || []).filter(c => c.artwork_id === art.id).map(c => c.category);
        const artTags = (tags || []).filter(t => t.artwork_id === art.id).map(t => t.tag);

        md += `## ${i + 1}. ${art.title}\n\n`;
        md += `![${art.title}](${art.image_url})\n\n`;
        md += `- **Status:** ${art.analysis_status}\n`;
        md += `- **Date:** ${new Date(art.created_at).toLocaleDateString()}\n`;
        if (artCats.length) md += `- **Categories:** ${artCats.join(", ")}\n`;
        if (artTags.length) md += `- **Tags:** ${artTags.join(", ")}\n`;
        if (analysis?.ai_description) md += `\n${analysis.ai_description}\n`;
        if (analysis?.composition) md += `\n**Composition:** ${analysis.composition}\n`;
        md += "\n---\n\n";
      });

      const blob = new Blob([md], { type: "text/markdown" });
      downloadBlob(blob, `art-archive-${Date.now()}.md`);
      toast("Exported", { description: `${artworks.length} artworks exported as Markdown.` });
    } catch (err: any) {
      toast.error("Export failed", { description: err.message });
    }
    setExporting(null);
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const rssUrl = `https://xgekguwametrtbsirjig.supabase.co/functions/v1/rss-feed`;

  const copyRss = () => {
    navigator.clipboard.writeText(rssUrl);
    toast("Copied", { description: "RSS feed URL copied to clipboard." });
  };

  const exportOptions = [
    {
      id: "json",
      label: "Full JSON Archive",
      description: "Complete dataset with all metadata, AI analysis, categories, and tags. Best for backups and programmatic use.",
      icon: FileJson,
      action: exportJSON,
    },
    {
      id: "csv",
      label: "CSV Spreadsheet",
      description: "Tabular export for spreadsheets. Includes titles, categories, tags, and dimensions.",
      icon: FileText,
      action: exportCSV,
    },
    {
      id: "md",
      label: "Markdown Portfolio",
      description: "Formatted document with embedded images and AI descriptions. Ready for documentation or blogs.",
      icon: FileText,
      action: exportMarkdown,
    },
  ];

  return (
    <div className="px-8 py-10 max-w-4xl mx-auto">
      <div className="mb-10">
        <span className="catalog-num">Data & Portability</span>
        <h1 className="font-serif text-3xl mt-2 text-foreground">Exports</h1>
        <p className="font-mono text-xs text-muted-foreground mt-2 tracking-wide max-w-lg">
          Export your archive in multiple formats. Take your data anywhere — use it as reference,
          feed it into other tools, or create portfolio documents.
        </p>
      </div>

      <div className="border-t border-accent border-2 mb-8" />

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-px bg-border border border-border mb-10">
        <div className="bg-background p-4 text-center">
          <p className="font-serif text-2xl text-foreground">{artworks.length}</p>
          <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase mt-1">Artworks</p>
        </div>
        <div className="bg-background p-4 text-center">
          <p className="font-serif text-2xl text-foreground">{artworks.filter(a => a.analysis_status === "complete").length}</p>
          <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase mt-1">Analyzed</p>
        </div>
        <div className="bg-background p-4 text-center">
          <p className="font-serif text-2xl text-foreground">
            {artworks.reduce((sum, a) => sum + (a.file_size_bytes || 0), 0) > 1024 * 1024
              ? `${(artworks.reduce((sum, a) => sum + (a.file_size_bytes || 0), 0) / (1024 * 1024)).toFixed(1)} MB`
              : `${(artworks.reduce((sum, a) => sum + (a.file_size_bytes || 0), 0) / 1024).toFixed(0)} KB`
            }
          </p>
          <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase mt-1">Total Size</p>
        </div>
      </div>

      {/* Export options */}
      <div className="space-y-0 border border-border divide-y divide-border mb-10">
        {exportOptions.map(opt => (
          <div key={opt.id} className="flex items-center justify-between p-5 hover:bg-secondary/50 transition-colors">
            <div className="flex items-start gap-4">
              <div className="border border-border p-2.5 mt-0.5">
                <opt.icon className="h-4 w-4 text-foreground" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="font-serif text-sm text-foreground">{opt.label}</h3>
                <p className="font-mono text-[10px] text-muted-foreground tracking-wide mt-1 max-w-md">{opt.description}</p>
              </div>
            </div>
            <Button
              variant="archive"
              size="sm"
              onClick={opt.action}
              disabled={loading || artworks.length === 0 || exporting !== null}
            >
              {exporting === opt.id ? (
                <><Loader2 className="h-3 w-3 mr-1.5 animate-spin" />Exporting…</>
              ) : (
                <><Download className="h-3 w-3 mr-1.5" strokeWidth={1.5} />Export</>
              )}
            </Button>
          </div>
        ))}
      </div>

      {/* RSS Feed */}
      <div className="border border-border p-5">
        <div className="flex items-start gap-4">
          <div className="border border-border p-2.5">
            <Rss className="h-4 w-4 text-accent" strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <h3 className="font-serif text-sm text-foreground">RSS Feed</h3>
            <p className="font-mono text-[10px] text-muted-foreground tracking-wide mt-1">
              Subscribe from any RSS reader. Auto-updates when you upload new work.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <code className="font-mono text-[10px] text-foreground bg-secondary px-2 py-1 border border-border flex-1 truncate">
                {rssUrl}
              </code>
              <Button variant="outline" size="sm" className="font-mono text-[10px] tracking-wide shrink-0" onClick={copyRss}>
                Copy URL
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

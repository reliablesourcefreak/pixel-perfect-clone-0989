import { useNavigate } from "react-router-dom";
import { Image, BookOpen, BookText, FolderOpen, Clock, Network, Star, Zap, ArrowRight, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    icon: Upload,
    title: "Upload & Auto-Analyze",
    body: "Drop your artwork in. The system deconstructs it — extracting color palettes, classifying style, identifying mood, and generating descriptors. No manual tagging required.",
  },
  {
    icon: Image,
    title: "The Gallery",
    body: "A searchable, filterable archive of every piece. Category-coded, tag-indexed, and ready for deep exploration through a museum-grade grid interface.",
  },
  {
    icon: FolderOpen,
    title: "Collections & Curation",
    body: "Group works into thematic boards. Pin your favorites. Build visual narratives by hand while the AI handles the metadata beneath.",
  },
  {
    icon: BookOpen,
    title: "The Codex",
    body: "A living knowledge base — characters, worlds, concepts, techniques. Each entry can be linked to artworks, enriched with AI summaries, and visualized through relationship graphs.",
  },
  {
    icon: BookText,
    title: "Stories & Scenes",
    body: "Structure narratives scene by scene. Attach artworks and codex entries to each beat. Drag to reorder. Inline-edit everything. Let the archive become a storyboard.",
  },
  {
    icon: Clock,
    title: "Timeline",
    body: "Watch your creative evolution unfold chronologically. Every upload, every entry, every story milestone — mapped across time in a living chronicle.",
  },
  {
    icon: Network,
    title: "Relationship Mapping",
    body: "AI-powered connection suggestions discover thematic links between your work and your knowledge base. Visualize them as force-directed graphs.",
  },
  {
    icon: Star,
    title: "Favorites & Quick Actions",
    body: "Star pieces for instant access. Bulk-select for batch operations. Add to collections from the grid. The interface stays out of your way.",
  },
];

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero */}
      <section className="px-8 py-20 lg:py-32">
        <span className="catalog-num">System Manifesto</span>
        <h1 className="font-serif text-5xl lg:text-7xl mt-4 text-foreground leading-[1.05] tracking-tight max-w-3xl">
          Every artwork<br />
          deserves an<br />
          <span className="text-accent italic">archive.</span>
        </h1>
        <div className="mt-8 max-w-lg">
          <p className="font-mono text-xs text-muted-foreground tracking-wide leading-relaxed">
            Orbit is an intelligent exhibition system built for artists who create at scale.
            It doesn't just store your work — it understands it. Through AI-driven analysis,
            automated categorization, and deep cross-referencing, your creative output becomes
            a navigable, interconnected body of knowledge.
          </p>
          <p className="font-mono text-xs text-muted-foreground tracking-wide leading-relaxed mt-4">
            Think of it as a personal museum with a research department.
          </p>
        </div>
        <div className="mt-10 flex gap-3">
          <Button variant="archive" onClick={() => navigate("/gallery")} className="group">
            Enter the Archive
            <ArrowRight className="h-3 w-3 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={1.5} />
          </Button>
          <Button variant="outline" className="font-mono text-xs tracking-wide border-border hover:border-foreground" onClick={() => navigate("/auth")}>
            Get Started
          </Button>
        </div>
      </section>

      {/* Divider */}
      <div className="mx-8 border-t-2 border-accent" />

      {/* Philosophy strip */}
      <section className="px-8 py-16 grid grid-cols-1 md:grid-cols-3 gap-px bg-border border-x border-border">
        {[
          { num: "01", title: "Capture", text: "Upload raw output. The system ingests and prepares it for analysis." },
          { num: "02", title: "Understand", text: "AI deconstructs visual language — style, color, mood, composition." },
          { num: "03", title: "Connect", text: "Artworks link to knowledge, narratives, and each other. A web of meaning emerges." },
        ].map(step => (
          <div key={step.num} className="bg-background p-8">
            <span className="font-mono text-4xl text-border font-medium">{step.num}</span>
            <h3 className="font-serif text-xl text-foreground mt-3">{step.title}</h3>
            <p className="font-mono text-xs text-muted-foreground mt-3 tracking-wide leading-relaxed">
              {step.text}
            </p>
          </div>
        ))}
      </section>

      {/* Features */}
      <section className="px-8 py-16">
        <div className="mb-12">
          <span className="catalog-num">Capabilities Index</span>
          <h2 className="font-serif text-3xl mt-2 text-foreground">What the system does</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border border border-border">
          {FEATURES.map((feat, i) => (
            <div key={feat.title} className="bg-background p-8 group">
              <div className="flex items-start gap-4">
                <div className="shrink-0 h-10 w-10 border border-border flex items-center justify-center group-hover:border-accent group-hover:bg-accent/5 transition-colors">
                  <feat.icon className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" strokeWidth={1.5} />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <span className="catalog-num">F-{String(i + 1).padStart(2, "0")}</span>
                    <h3 className="font-serif text-base text-foreground">{feat.title}</h3>
                  </div>
                  <p className="font-mono text-xs text-muted-foreground mt-2 tracking-wide leading-relaxed">
                    {feat.body}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* AI section */}
      <div className="mx-8 border-t border-border" />
      <section className="px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-12">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-3.5 w-3.5 text-accent" strokeWidth={1.5} />
              <span className="section-label">Intelligence Layer</span>
            </div>
            <h2 className="font-serif text-3xl text-foreground">
              AI that serves<br />the <span className="italic text-accent">artist</span>
            </h2>
          </div>
          <div className="space-y-6">
            {[
              { label: "Visual Analysis", desc: "Every upload is processed through multimodal AI to extract style classifications, color palettes, compositional analysis, mood detection, and technical descriptors." },
              { label: "Smart Summaries", desc: "Codex entries and stories receive AI-generated summaries that distill complex lore and narrative arcs into scannable insights." },
              { label: "Connection Discovery", desc: "The 'Suggest Connections' engine cross-references codex content against your entire artwork catalog, surfacing thematic relationships you might have missed." },
              { label: "Batch Intelligence", desc: "Bulk tagging, batch categorization, and automated metadata enrichment across your entire collection — not just one piece at a time." },
            ].map(item => (
              <div key={item.label} className="border-l-2 border-border pl-5 hover:border-accent transition-colors">
                <h4 className="font-mono text-xs tracking-widest uppercase text-foreground font-medium">{item.label}</h4>
                <p className="font-mono text-xs text-muted-foreground mt-1.5 tracking-wide leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing */}
      <div className="mx-8 border-t-2 border-accent" />
      <section className="px-8 py-20 text-center">
        <span className="catalog-num">End of Manifesto</span>
        <h2 className="font-serif text-4xl text-foreground mt-4 max-w-xl mx-auto leading-tight">
          Your work is more than files.<br />
          <span className="italic text-accent">It's a body of knowledge.</span>
        </h2>
        <p className="font-mono text-xs text-muted-foreground mt-6 tracking-wide max-w-md mx-auto leading-relaxed">
          Orbit transforms scattered creative output into a structured, searchable,
          interconnected archive — with intelligence built into every layer.
        </p>
        <div className="mt-8">
          <Button variant="archive" size="lg" onClick={() => navigate("/gallery")} className="group">
            Explore the Archive
            <ArrowRight className="h-3.5 w-3.5 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={1.5} />
          </Button>
        </div>
      </section>

      {/* Footer strip */}
      <div className="mx-8 border-t border-border py-6 flex items-center justify-between">
        <span className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
          Orbit — Creative OS
        </span>
        <span className="font-mono text-[10px] text-muted-foreground tracking-widest">
          Built for artists. Powered by intelligence.
        </span>
      </div>
    </div>
  );
}

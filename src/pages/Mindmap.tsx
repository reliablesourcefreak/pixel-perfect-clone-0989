import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ZoomIn, ZoomOut, Maximize2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ArtNode {
  id: string;
  title: string;
  image_url: string;
  tags: string[];
  categories: string[];
}

interface Edge {
  from: string;
  to: string;
  shared: string[];
  type: "tag" | "category";
}

export default function Mindmap() {
  const [nodes, setNodes] = useState<ArtNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"all" | "tags" | "categories">("all");
  const canvasRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const { data: arts } = await supabase
        .from("artworks")
        .select("id, title, image_url")
        .order("created_at", { ascending: false })
        .limit(100);

      if (!arts || arts.length === 0) { setLoading(false); return; }

      const ids = arts.map(a => a.id);
      const [{ data: cats }, { data: tags }] = await Promise.all([
        supabase.from("artwork_categories").select("artwork_id, category").in("artwork_id", ids),
        supabase.from("artwork_tags").select("artwork_id, tag").in("artwork_id", ids),
      ]);

      const artNodes: ArtNode[] = arts.map(a => ({
        ...a,
        tags: (tags || []).filter(t => t.artwork_id === a.id).map(t => t.tag),
        categories: (cats || []).filter(c => c.artwork_id === a.id).map(c => c.category),
      }));

      // Build edges based on shared tags/categories
      const edgeList: Edge[] = [];
      for (let i = 0; i < artNodes.length; i++) {
        for (let j = i + 1; j < artNodes.length; j++) {
          const sharedTags = artNodes[i].tags.filter(t => artNodes[j].tags.includes(t));
          const sharedCats = artNodes[i].categories.filter(c => artNodes[j].categories.includes(c));

          if (sharedTags.length >= 2) {
            edgeList.push({ from: artNodes[i].id, to: artNodes[j].id, shared: sharedTags.slice(0, 3), type: "tag" });
          }
          if (sharedCats.length >= 1) {
            edgeList.push({ from: artNodes[i].id, to: artNodes[j].id, shared: sharedCats, type: "category" });
          }
        }
      }

      setNodes(artNodes);
      setEdges(edgeList);
      setLoading(false);
    };
    load();
  }, []);

  // Force-directed layout positions
  const positions = useMemo(() => {
    if (nodes.length === 0) return new Map<string, { x: number; y: number }>();

    const pos = new Map<string, { x: number; y: number }>();
    const centerX = 600;
    const centerY = 400;

    // Place nodes in a force-like spiral layout
    // Group by primary category for clustering
    const catGroups = new Map<string, ArtNode[]>();
    nodes.forEach(n => {
      const cat = n.categories[0] || "Uncategorized";
      if (!catGroups.has(cat)) catGroups.set(cat, []);
      catGroups.get(cat)!.push(n);
    });

    const groupKeys = Array.from(catGroups.keys());
    const angleStep = (2 * Math.PI) / Math.max(groupKeys.length, 1);

    groupKeys.forEach((cat, gi) => {
      const groupAngle = angleStep * gi;
      const groupRadius = 200 + groupKeys.length * 15;
      const groupCenterX = centerX + Math.cos(groupAngle) * groupRadius;
      const groupCenterY = centerY + Math.sin(groupAngle) * groupRadius;

      const members = catGroups.get(cat)!;
      members.forEach((node, ni) => {
        const subAngle = (2 * Math.PI / Math.max(members.length, 1)) * ni;
        const subRadius = 40 + members.length * 12;
        pos.set(node.id, {
          x: groupCenterX + Math.cos(subAngle) * subRadius,
          y: groupCenterY + Math.sin(subAngle) * subRadius,
        });
      });
    });

    return pos;
  }, [nodes]);

  const filteredEdges = useMemo(() => {
    if (filterType === "all") return edges;
    return edges.filter(e => e.type === (filterType === "tags" ? "tag" : "category"));
  }, [edges, filterType]);

  const connectedToSelected = useMemo(() => {
    if (!selectedNode) return new Set<string>();
    const connected = new Set<string>();
    filteredEdges.forEach(e => {
      if (e.from === selectedNode) connected.add(e.to);
      if (e.to === selectedNode) connected.add(e.from);
    });
    return connected;
  }, [selectedNode, filteredEdges]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-node]")) return;
    setDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }, [dragging, dragStart]);

  const handleMouseUp = useCallback(() => setDragging(false), []);

  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); setSelectedNode(null); };

  // Compute canvas bounds
  const bounds = useMemo(() => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    positions.forEach(p => {
      minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
    });
    return { width: maxX - minX + 300, height: maxY - minY + 300 };
  }, [positions]);

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col">
      {/* Header */}
      <div className="px-8 py-5 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <span className="catalog-num">Relationship Graph</span>
            <h1 className="font-serif text-2xl mt-1 text-foreground">Mindmap</h1>
            <p className="font-mono text-[10px] text-muted-foreground tracking-wide mt-1">
              {nodes.length} nodes · {filteredEdges.length} connections
              {selectedNode && ` · ${connectedToSelected.size} linked to selection`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Filter */}
            <div className="flex border border-border divide-x divide-border">
              {(["all", "tags", "categories"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilterType(f)}
                  className={`px-3 py-1.5 font-mono text-[10px] tracking-wide uppercase transition-colors ${
                    filterType === f ? "bg-foreground text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="w-px h-6 bg-border" />
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(z => Math.min(z + 0.2, 3))}>
              <ZoomIn className="h-3.5 w-3.5" strokeWidth={1.5} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(z => Math.max(z - 0.2, 0.3))}>
              <ZoomOut className="h-3.5 w-3.5" strokeWidth={1.5} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={resetView}>
              <Maximize2 className="h-3.5 w-3.5" strokeWidth={1.5} />
            </Button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="font-mono text-xs text-muted-foreground tracking-wide animate-pulse">Mapping relationships…</p>
        </div>
      ) : nodes.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="font-mono text-xs text-muted-foreground tracking-wide">Upload artworks to visualize their relationships.</p>
          </div>
        </div>
      ) : (
        <div
          ref={canvasRef}
          className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing bg-background relative"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0" }}
          >
            {/* Edges */}
            {filteredEdges.map((edge, i) => {
              const fromPos = positions.get(edge.from);
              const toPos = positions.get(edge.to);
              if (!fromPos || !toPos) return null;

              const isHighlighted = selectedNode && (edge.from === selectedNode || edge.to === selectedNode);
              const isDimmed = selectedNode && !isHighlighted;

              return (
                <line
                  key={i}
                  x1={fromPos.x}
                  y1={fromPos.y}
                  x2={toPos.x}
                  y2={toPos.y}
                  stroke={isHighlighted
                    ? (edge.type === "category" ? "hsl(var(--accent))" : "hsl(var(--foreground))")
                    : "hsl(var(--border))"
                  }
                  strokeWidth={isHighlighted ? 2 : 1}
                  opacity={isDimmed ? 0.15 : isHighlighted ? 1 : 0.4}
                  strokeDasharray={edge.type === "tag" ? "4 4" : "none"}
                />
              );
            })}
          </svg>

          <div
            className="absolute inset-0"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0" }}
          >
            {/* Nodes */}
            {nodes.map(node => {
              const pos = positions.get(node.id);
              if (!pos) return null;

              const isSelected = selectedNode === node.id;
              const isConnected = connectedToSelected.has(node.id);
              const isDimmed = selectedNode && !isSelected && !isConnected;
              const isHovered = hoveredNode === node.id;

              return (
                <div
                  key={node.id}
                  data-node
                  className="absolute cursor-pointer transition-all duration-300"
                  style={{
                    left: pos.x - 28,
                    top: pos.y - 28,
                    opacity: isDimmed ? 0.2 : 1,
                    zIndex: isSelected ? 30 : isHovered ? 20 : 10,
                  }}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNode(prev => prev === node.id ? null : node.id);
                  }}
                  onDoubleClick={() => navigate(`/gallery/${node.id}`)}
                >
                  <div className={`relative transition-all duration-200 ${
                    isSelected ? "ring-2 ring-accent" : isHovered ? "ring-1 ring-foreground" : ""
                  }`}>
                    <img
                      src={node.image_url}
                      alt={node.title}
                      className="h-14 w-14 object-cover border border-border"
                      loading="lazy"
                    />
                    {/* Category dot */}
                    {node.categories[0] && (
                      <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-accent border border-background" />
                    )}
                  </div>

                  {/* Tooltip */}
                  {(isHovered || isSelected) && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 w-48 bg-card border border-border p-3 pointer-events-none">
                      <p className="font-serif text-xs text-foreground truncate">{node.title}</p>
                      {node.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {node.categories.map(c => (
                            <span key={c} className="font-mono text-[9px] text-accent tracking-wide">{c}</span>
                          ))}
                        </div>
                      )}
                      {node.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {node.tags.slice(0, 5).map(t => (
                            <span key={t} className="font-mono text-[9px] text-muted-foreground px-1 py-0.5 border border-border">{t}</span>
                          ))}
                        </div>
                      )}
                      <p className="font-mono text-[9px] text-muted-foreground mt-2 tracking-wide">Double-click to open</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-card border border-border p-3 z-40">
            <span className="section-label">Legend</span>
            <div className="mt-2 space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-px bg-foreground" />
                <span className="font-mono text-[9px] text-muted-foreground">Category link</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-px bg-foreground" style={{ borderTop: "1px dashed" }} />
                <span className="font-mono text-[9px] text-muted-foreground">Tag link (2+ shared)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-accent" />
                <span className="font-mono text-[9px] text-muted-foreground">Categorized node</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

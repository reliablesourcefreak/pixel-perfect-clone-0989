import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface GraphNode {
  id: string;
  label: string;
  type: "codex" | "artwork";
  subtype?: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface GraphEdge {
  source: string;
  target: string;
}

const NODE_COLORS: Record<string, string> = {
  character: "hsl(350, 65%, 50%)",
  world: "hsl(210, 80%, 55%)",
  concept: "hsl(280, 65%, 55%)",
  technique: "hsl(35, 85%, 55%)",
  reference: "hsl(160, 60%, 45%)",
  other: "hsl(45, 70%, 50%)",
  artwork: "hsl(0, 72%, 51%)",
};

interface Props {
  codexEntryId: string;
  linkedArtworkIds: string[];
}

export default function RelationshipGraph({ codexEntryId, linkedArtworkIds }: Props) {
  const navigate = useNavigate();
  const svgRef = useRef<SVGSVGElement>(null);
  const animRef = useRef<number>(0);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const nodesRef = useRef<GraphNode[]>([]);

  useEffect(() => {
    (async () => {
      const { data: thisEntry } = await supabase
        .from("codex_entries")
        .select("id, title, type")
        .eq("id", codexEntryId)
        .single();
      if (!thisEntry) return;

      const { data: artworks } = await supabase
        .from("artworks")
        .select("id, title")
        .in("id", linkedArtworkIds.length > 0 ? linkedArtworkIds : ["_"]);

      const { data: sharedLinks } = await supabase
        .from("codex_artwork_links")
        .select("codex_entry_id, artwork_id")
        .in("artwork_id", linkedArtworkIds.length > 0 ? linkedArtworkIds : ["_"])
        .neq("codex_entry_id", codexEntryId);

      const otherCodexIds = [...new Set((sharedLinks || []).map(l => l.codex_entry_id))];
      const { data: otherEntries } = otherCodexIds.length > 0
        ? await supabase.from("codex_entries").select("id, title, type").in("id", otherCodexIds)
        : { data: [] };

      const cx = 400, cy = 250;
      const graphNodes: GraphNode[] = [];
      const graphEdges: GraphEdge[] = [];

      graphNodes.push({
        id: thisEntry.id, label: thisEntry.title, type: "codex",
        subtype: thisEntry.type, x: cx, y: cy, vx: 0, vy: 0,
      });

      (artworks || []).forEach((a, i) => {
        const angle = (2 * Math.PI * i) / Math.max((artworks || []).length, 1);
        graphNodes.push({
          id: a.id, label: a.title, type: "artwork",
          x: cx + Math.cos(angle) * 160 + (Math.random() - 0.5) * 20,
          y: cy + Math.sin(angle) * 140 + (Math.random() - 0.5) * 20,
          vx: 0, vy: 0,
        });
        graphEdges.push({ source: thisEntry.id, target: a.id });
      });

      (otherEntries || []).forEach((e, i) => {
        const angle = (2 * Math.PI * i) / Math.max((otherEntries || []).length, 1) + Math.PI / 4;
        graphNodes.push({
          id: e.id, label: e.title, type: "codex", subtype: e.type,
          x: cx + Math.cos(angle) * 280 + (Math.random() - 0.5) * 30,
          y: cy + Math.sin(angle) * 220 + (Math.random() - 0.5) * 30,
          vx: 0, vy: 0,
        });
        (sharedLinks || []).filter(l => l.codex_entry_id === e.id).forEach(l => {
          graphEdges.push({ source: e.id, target: l.artwork_id });
        });
      });

      nodesRef.current = graphNodes;
      setNodes([...graphNodes]);
      setEdges(graphEdges);
    })();
  }, [codexEntryId, linkedArtworkIds]);

  useEffect(() => {
    if (nodes.length === 0) return;
    let running = true;
    const tick = () => {
      if (!running) return;
      const ns = nodesRef.current;
      const damping = 0.85;
      const repulsion = 3000;
      const springLen = 180;
      const springK = 0.008;
      const centerPull = 0.001;

      for (let i = 0; i < ns.length; i++) {
        if (ns[i].id === dragging) continue;
        let fx = 0, fy = 0;
        for (let j = 0; j < ns.length; j++) {
          if (i === j) continue;
          const dx = ns[i].x - ns[j].x;
          const dy = ns[i].y - ns[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          fx += (dx / dist) * repulsion / (dist * dist);
          fy += (dy / dist) * repulsion / (dist * dist);
        }
        edges.forEach(e => {
          let other: GraphNode | undefined;
          if (e.source === ns[i].id) other = ns.find(n => n.id === e.target);
          else if (e.target === ns[i].id) other = ns.find(n => n.id === e.source);
          if (!other) return;
          const dx = other.x - ns[i].x;
          const dy = other.y - ns[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (dist - springLen) * springK;
          fx += (dx / dist) * force;
          fy += (dy / dist) * force;
        });
        fx += (400 - ns[i].x) * centerPull;
        fy += (250 - ns[i].y) * centerPull;

        ns[i].vx = (ns[i].vx + fx) * damping;
        ns[i].vy = (ns[i].vy + fy) * damping;
        ns[i].x += ns[i].vx;
        ns[i].y += ns[i].vy;
        ns[i].x = Math.max(40, Math.min(760, ns[i].x));
        ns[i].y = Math.max(40, Math.min(460, ns[i].y));
      }
      setNodes([...ns]);
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => { running = false; cancelAnimationFrame(animRef.current); };
  }, [edges, dragging]);

  const handleMouseDown = useCallback((id: string) => setDragging(id), []);
  const handleMouseUp = useCallback(() => setDragging(null), []);
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragging || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const node = nodesRef.current.find(n => n.id === dragging);
    if (node) { node.x = x; node.y = y; node.vx = 0; node.vy = 0; }
  }, [dragging]);

  const handleClick = (node: GraphNode) => {
    if (node.id === codexEntryId) return;
    if (node.type === "artwork") navigate(`/gallery/${node.id}`);
    else navigate(`/codex/${node.id}`);
  };

  if (nodes.length <= 1) return null;

  return (
    <div>
      <span className="section-label">Relationship Graph</span>
      <div className="border-t border-border mt-2 mb-4" />
      <div className="border border-border bg-card overflow-hidden">
        <svg
          ref={svgRef}
          viewBox="0 0 800 500"
          className="w-full h-auto"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {edges.map((e, i) => {
            const s = nodes.find(n => n.id === e.source);
            const t = nodes.find(n => n.id === e.target);
            if (!s || !t) return null;
            const isHighlighted = hovered && (e.source === hovered || e.target === hovered);
            return (
              <line
                key={i}
                x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                stroke={isHighlighted ? "hsl(0, 72%, 51%)" : "hsl(0, 0%, 60%)"}
                strokeWidth={isHighlighted ? 1.5 : 0.5}
                strokeDasharray={isHighlighted ? undefined : "4 4"}
                opacity={hovered && !isHighlighted ? 0.15 : 0.6}
                className="transition-all duration-200"
              />
            );
          })}
          {nodes.map(node => {
            const isCenter = node.id === codexEntryId;
            const r = isCenter ? 28 : node.type === "codex" ? 20 : 16;
            const color = node.type === "artwork"
              ? NODE_COLORS.artwork
              : NODE_COLORS[node.subtype || "other"];
            const isActive = hovered === node.id;
            return (
              <g
                key={node.id}
                className="cursor-pointer"
                onMouseEnter={() => setHovered(node.id)}
                onMouseLeave={() => setHovered(null)}
                onMouseDown={() => handleMouseDown(node.id)}
                onClick={() => handleClick(node)}
              >
                {isActive && (
                  <circle cx={node.x} cy={node.y} r={r + 6} fill={color} opacity={0.15} />
                )}
                <circle
                  cx={node.x} cy={node.y} r={r}
                  fill={isCenter ? color : "hsl(0, 0%, 100%)"}
                  stroke={color}
                  strokeWidth={isCenter ? 2.5 : 1.5}
                />
                {node.type === "artwork" && (
                  <rect x={node.x - 5} y={node.y - 5} width={10} height={10} fill={color} opacity={0.6} />
                )}
                {node.type === "codex" && !isCenter && (
                  <circle cx={node.x} cy={node.y} r={4} fill={color} opacity={0.5} />
                )}
                <text
                  x={node.x} y={node.y + r + 14}
                  textAnchor="middle"
                  className="fill-foreground"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: isCenter ? "10px" : "8px",
                    letterSpacing: "0.05em",
                    fontWeight: isCenter ? 600 : 400,
                  }}
                >
                  {node.label.length > 18 ? node.label.slice(0, 16) + "…" : node.label}
                </text>
                {isActive && (
                  <text
                    x={node.x} y={node.y + r + 25}
                    textAnchor="middle"
                    fill="hsl(0, 0%, 50%)"
                    style={{ fontFamily: "var(--font-mono)", fontSize: "7px", letterSpacing: "0.15em", textTransform: "uppercase" }}
                  >
                    {node.type === "artwork" ? "ARTWORK" : (node.subtype || "CODEX").toUpperCase()}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

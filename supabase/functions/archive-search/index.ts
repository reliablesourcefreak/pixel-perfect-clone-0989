import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SearchHit {
  type: "artwork" | "codex" | "story" | "collection";
  id: string;
  title: string;
  snippet: string;
  score: number;
  meta?: Record<string, unknown>;
}

function score(hay: string, q: string): number {
  const h = hay.toLowerCase();
  const n = q.toLowerCase();
  if (!n) return 0;
  if (h === n) return 100;
  if (h.startsWith(n)) return 80;
  if (h.includes(` ${n}`)) return 60;
  if (h.includes(n)) return 40;
  return 0;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    let q = url.searchParams.get("q") ?? "";
    let types = (url.searchParams.get("types") || "artwork,codex,story,collection").split(",");
    let limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);

    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      if (body.q) q = body.q;
      if (Array.isArray(body.types)) types = body.types;
      if (body.limit) limit = Math.min(Number(body.limit), 100);
    }

    if (!q || q.trim().length < 2) {
      return new Response(JSON.stringify({ error: "q must be at least 2 characters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const term = q.trim();
    const ilike = `%${term}%`;
    const hits: SearchHit[] = [];

    if (types.includes("artwork")) {
      const { data: arts } = await sb
        .from("artworks")
        .select("id, title, image_url, created_at")
        .ilike("title", ilike)
        .limit(limit);
      (arts || []).forEach((a) =>
        hits.push({
          type: "artwork",
          id: a.id,
          title: a.title,
          snippet: a.title,
          score: score(a.title, term),
          meta: { image_url: a.image_url, created_at: a.created_at },
        }),
      );

      const { data: tagHits } = await sb
        .from("artwork_tags")
        .select("artwork_id, tag")
        .ilike("tag", ilike)
        .limit(limit);
      const tagArtIds = Array.from(new Set((tagHits || []).map((t) => t.artwork_id)));
      if (tagArtIds.length) {
        const { data: arts2 } = await sb
          .from("artworks")
          .select("id, title, image_url")
          .in("id", tagArtIds);
        (arts2 || []).forEach((a) => {
          if (hits.some((h) => h.type === "artwork" && h.id === a.id)) return;
          const tag = tagHits!.find((t) => t.artwork_id === a.id)?.tag || "";
          hits.push({
            type: "artwork",
            id: a.id,
            title: a.title,
            snippet: `tag: ${tag}`,
            score: score(tag, term) - 5,
            meta: { image_url: a.image_url, matched_tag: tag },
          });
        });
      }
    }

    if (types.includes("codex")) {
      const { data: c } = await sb
        .from("codex_entries")
        .select("id, title, type, ai_summary, content")
        .or(`title.ilike.${ilike},content.ilike.${ilike},ai_summary.ilike.${ilike}`)
        .limit(limit);
      (c || []).forEach((e) => {
        const snippetSrc = e.ai_summary || e.content || "";
        hits.push({
          type: "codex",
          id: e.id,
          title: e.title,
          snippet: snippetSrc.slice(0, 160),
          score: Math.max(score(e.title, term), score(snippetSrc, term) - 10),
          meta: { entry_type: e.type },
        });
      });
    }

    if (types.includes("story")) {
      const { data: s } = await sb
        .from("stories")
        .select("id, title, status, ai_summary, description")
        .or(`title.ilike.${ilike},description.ilike.${ilike},ai_summary.ilike.${ilike}`)
        .limit(limit);
      (s || []).forEach((e) => {
        const snippetSrc = e.ai_summary || e.description || "";
        hits.push({
          type: "story",
          id: e.id,
          title: e.title,
          snippet: snippetSrc.slice(0, 160),
          score: Math.max(score(e.title, term), score(snippetSrc, term) - 10),
          meta: { status: e.status },
        });
      });
    }

    if (types.includes("collection")) {
      const { data: col } = await sb
        .from("collections")
        .select("id, name, description, is_smart")
        .or(`name.ilike.${ilike},description.ilike.${ilike}`)
        .limit(limit);
      (col || []).forEach((c) =>
        hits.push({
          type: "collection",
          id: c.id,
          title: c.name,
          snippet: (c.description || "").slice(0, 160),
          score: score(c.name, term),
          meta: { is_smart: c.is_smart },
        }),
      );
    }

    hits.sort((a, b) => b.score - a.score);
    const trimmed = hits.slice(0, limit);

    return new Response(
      JSON.stringify({
        query: term,
        types,
        total: trimmed.length,
        hits: trimmed,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("archive-search error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
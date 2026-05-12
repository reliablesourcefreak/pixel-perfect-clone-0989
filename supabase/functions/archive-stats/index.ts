import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function tally(items: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  items.forEach((i) => {
    if (!i) return;
    out[i] = (out[i] || 0) + 1;
  });
  return out;
}

function topN(record: Record<string, number>, n: number) {
  return Object.entries(record)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([key, count]) => ({ key, count }));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("user_id");

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let aq = sb.from("artworks").select("id, user_id, analysis_status, is_favorited, created_at").limit(2000);
    if (userId) aq = aq.eq("user_id", userId);
    const { data: artworks } = await aq;
    const ids = (artworks || []).map((a) => a.id);

    const [{ data: analysis }, { data: tags }, { data: cats }, { data: collections }, { data: codex }, { data: stories }] = await Promise.all([
      sb.from("artwork_analysis").select("artwork_id, moods, styles, color_palette").in("artwork_id", ids),
      sb.from("artwork_tags").select("tag").in("artwork_id", ids),
      sb.from("artwork_categories").select("category").in("artwork_id", ids),
      userId ? sb.from("collections").select("id, is_smart, is_public").eq("user_id", userId) : sb.from("collections").select("id, is_smart, is_public").limit(2000),
      userId ? sb.from("codex_entries").select("id, type").eq("user_id", userId) : sb.from("codex_entries").select("id, type").limit(2000),
      userId ? sb.from("stories").select("id, status").eq("user_id", userId) : sb.from("stories").select("id, status").limit(2000),
    ]);

    const allMoods = (analysis || []).flatMap((a) => a.moods || []);
    const allStyles = (analysis || []).flatMap((a) => a.styles || []);
    const allTags = (tags || []).map((t) => t.tag);
    const allCats = (cats || []).map((c) => c.category);
    const palette = (analysis || []).flatMap((a) => (Array.isArray(a.color_palette) ? a.color_palette : []) as Array<{ hex?: string; name?: string }>);

    const timeline: Record<string, number> = {};
    (artworks || []).forEach((a) => {
      const day = a.created_at?.slice(0, 10);
      if (!day) return;
      timeline[day] = (timeline[day] || 0) + 1;
    });

    const stats = {
      generated_at: new Date().toISOString(),
      scope: { user_id: userId },
      counts: {
        artworks: artworks?.length || 0,
        analyzed: (artworks || []).filter((a) => a.analysis_status === "completed").length,
        favorited: (artworks || []).filter((a) => a.is_favorited).length,
        codex_entries: codex?.length || 0,
        stories: stories?.length || 0,
        collections: collections?.length || 0,
        smart_collections: (collections || []).filter((c) => c.is_smart).length,
        public_collections: (collections || []).filter((c) => c.is_public).length,
      },
      top_moods: topN(tally(allMoods), 10),
      top_styles: topN(tally(allStyles), 10),
      top_tags: topN(tally(allTags), 20),
      top_categories: topN(tally(allCats), 10),
      palette_aggregate: topN(tally(palette.map((p) => (p.hex || "").toLowerCase()).filter(Boolean)), 24),
      story_status: tally((stories || []).map((s) => s.status)),
      codex_types: tally((codex || []).map((c) => c.type)),
      timeline: Object.entries(timeline)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date, count })),
    };

    return new Response(JSON.stringify(stats, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("archive-stats error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
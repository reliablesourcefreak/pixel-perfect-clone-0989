import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const headers = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const escape = (v: unknown) => {
    if (v == null) return "";
    const s = typeof v === "string" ? v : JSON.stringify(v);
    return `"${s.replace(/"/g, '""')}"`;
  };
  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const format = (url.searchParams.get("format") || "json").toLowerCase();
    const collectionId = url.searchParams.get("collection_id");
    const userId = url.searchParams.get("user_id");

    if (!["json", "csv"].includes(format)) {
      return new Response(JSON.stringify({ error: "format must be json or csv" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let artworkIds: string[] | null = null;
    if (collectionId) {
      const { data: links } = await sb
        .from("collection_artworks")
        .select("artwork_id")
        .eq("collection_id", collectionId);
      artworkIds = (links || []).map((l) => l.artwork_id);
      if (artworkIds.length === 0) {
        return new Response(format === "csv" ? "" : JSON.stringify({ artworks: [] }), {
          headers: {
            ...corsHeaders,
            "Content-Type": format === "csv" ? "text/csv" : "application/json",
          },
        });
      }
    }

    let q = sb
      .from("artworks")
      .select("id, user_id, title, image_url, width, height, file_size_bytes, analysis_status, is_favorited, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (userId) q = q.eq("user_id", userId);
    if (artworkIds) q = q.in("id", artworkIds);
    const { data: artworks, error } = await q;
    if (error) throw error;

    const ids = (artworks || []).map((a) => a.id);
    const [{ data: analysis }, { data: tags }, { data: cats }] = await Promise.all([
      sb.from("artwork_analysis").select("artwork_id, moods, styles, ai_description, composition, technical_details, color_palette").in("artwork_id", ids),
      sb.from("artwork_tags").select("artwork_id, tag").in("artwork_id", ids),
      sb.from("artwork_categories").select("artwork_id, category, confidence").in("artwork_id", ids),
    ]);

    const aMap = new Map((analysis || []).map((a) => [a.artwork_id, a]));
    const tMap = new Map<string, string[]>();
    (tags || []).forEach((t) => {
      if (!tMap.has(t.artwork_id)) tMap.set(t.artwork_id, []);
      tMap.get(t.artwork_id)!.push(t.tag);
    });
    const cMap = new Map<string, { category: string; confidence: number }[]>();
    (cats || []).forEach((c) => {
      if (!cMap.has(c.artwork_id)) cMap.set(c.artwork_id, []);
      cMap.get(c.artwork_id)!.push({ category: c.category, confidence: Number(c.confidence) });
    });

    const enriched = (artworks || []).map((a) => ({
      ...a,
      tags: tMap.get(a.id) || [],
      categories: cMap.get(a.id) || [],
      analysis: aMap.get(a.id) || null,
    }));

    if (format === "csv") {
      const flat = enriched.map((a) => ({
        id: a.id,
        title: a.title,
        image_url: a.image_url,
        width: a.width,
        height: a.height,
        analysis_status: a.analysis_status,
        is_favorited: a.is_favorited,
        created_at: a.created_at,
        tags: (a.tags || []).join("|"),
        categories: (a.categories || []).map((c) => c.category).join("|"),
        moods: a.analysis?.moods?.join("|") ?? "",
        styles: a.analysis?.styles?.join("|") ?? "",
        ai_description: a.analysis?.ai_description ?? "",
      }));
      return new Response(toCsv(flat), {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="atelier-archive-${Date.now()}.csv"`,
        },
      });
    }

    return new Response(
      JSON.stringify(
        {
          generated_at: new Date().toISOString(),
          count: enriched.length,
          scope: { collection_id: collectionId, user_id: userId },
          artworks: enriched,
        },
        null,
        2,
      ),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="atelier-archive-${Date.now()}.json"`,
        },
      },
    );
  } catch (e) {
    console.error("archive-export error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
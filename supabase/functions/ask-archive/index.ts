import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Build context from the archive
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    const [
      { data: artworks },
      { data: analysis },
      { data: tags },
      { data: categories },
      { data: codex },
      { data: stories },
      { data: collections },
    ] = await Promise.all([
      sb.from("artworks").select("id, title, analysis_status, created_at").order("created_at", { ascending: false }).limit(100),
      sb.from("artwork_analysis").select("artwork_id, moods, styles, ai_description, composition").limit(100),
      sb.from("artwork_tags").select("artwork_id, tag").limit(500),
      sb.from("artwork_categories").select("artwork_id, category, confidence").limit(500),
      sb.from("codex_entries").select("id, title, type, ai_summary, created_at").limit(50),
      sb.from("stories").select("id, title, status, ai_summary, created_at").limit(50),
      sb.from("collections").select("id, name, description").limit(50),
    ]);

    // Build a compact context string
    const analysisMap = new Map((analysis || []).map(a => [a.artwork_id, a]));
    const tagMap = new Map<string, string[]>();
    (tags || []).forEach(t => {
      if (!tagMap.has(t.artwork_id)) tagMap.set(t.artwork_id, []);
      tagMap.get(t.artwork_id)!.push(t.tag);
    });
    const catMap = new Map<string, string[]>();
    (categories || []).forEach(c => {
      if (!catMap.has(c.artwork_id)) catMap.set(c.artwork_id, []);
      catMap.get(c.artwork_id)!.push(c.category);
    });

    const artworkSummaries = (artworks || []).slice(0, 50).map(a => {
      const an = analysisMap.get(a.id);
      const t = tagMap.get(a.id) || [];
      const c = catMap.get(a.id) || [];
      return `- "${a.title}" (${a.created_at?.slice(0, 10)}) | categories: ${c.join(", ") || "none"} | tags: ${t.join(", ") || "none"} | moods: ${an?.moods?.join(", ") || "none"} | styles: ${an?.styles?.join(", ") || "none"} | description: ${an?.ai_description?.slice(0, 120) || "pending"}`;
    }).join("\n");

    const codexSummaries = (codex || []).map(c =>
      `- "${c.title}" (${c.type}) | summary: ${c.ai_summary?.slice(0, 100) || "none"}`
    ).join("\n");

    const storySummaries = (stories || []).map(s =>
      `- "${s.title}" (${s.status}) | summary: ${s.ai_summary?.slice(0, 100) || "none"}`
    ).join("\n");

    const collectionList = (collections || []).map(c => `- "${c.name}": ${c.description || "no description"}`).join("\n");

    const systemPrompt = `You are the Archive Intelligence — an AI assistant for a personal art archive called Orbit. You have deep knowledge of the user's entire collection.

ARCHIVE DATA:

## Artworks (${(artworks || []).length} total)
${artworkSummaries || "No artworks yet."}

## Codex Entries (${(codex || []).length})
${codexSummaries || "No codex entries yet."}

## Stories (${(stories || []).length})
${storySummaries || "No stories yet."}

## Collections (${(collections || []).length})
${collectionList || "No collections yet."}

INSTRUCTIONS:
- Answer questions about patterns, themes, moods, styles, and connections across the archive
- Reference specific artworks by name when relevant
- Be concise and insightful — speak like a knowledgeable curator
- Use markdown formatting for readability
- If asked about something not in the data, say so honestly
- Focus on creative insights and analytical observations`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ask-archive error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

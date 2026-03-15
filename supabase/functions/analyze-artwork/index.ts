import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { artwork_id, image_url } = await req.json();
    if (!artwork_id || !image_url) {
      return new Response(JSON.stringify({ error: "artwork_id and image_url required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const authHeader = req.headers.get("authorization")!;
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Update status to analyzing
    await supabase.from("artworks").update({ analysis_status: "analyzing" }).eq("id", artwork_id);

    // Call AI to analyze the artwork
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert art analyst and curator. Analyze the provided AI-generated artwork image and return a JSON object with these exact fields:

{
  "title_suggestion": "A descriptive, evocative title for the artwork",
  "description": "A detailed 2-3 sentence description of what the image depicts, its artistic qualities, and notable elements",
  "categories": [{"name": "Category Name", "confidence": 95}],
  "tags": ["tag1", "tag2", "tag3"],
  "styles": ["Style1", "Style2"],
  "moods": ["Mood1", "Mood2"],
  "composition": "Analysis of the composition, focal points, perspective, and spatial arrangement",
  "technical_details": "Analysis of rendering quality, lighting, textures, and technical execution",
  "color_palette": [{"name": "Color Name", "hex": "#RRGGBB"}]
}

Categories should be from: Digital, 3D Render, Concept Art, Abstract, Fantasy, Sci-Fi, Portrait, Landscape, Architecture, Character, Illustration, Photography Style. Include 2-5 with confidence percentages.
Tags should be 8-15 descriptive keywords.
Styles should be 3-6 art style descriptors.
Moods should be 3-5 emotional descriptors.
Color palette should be 4-8 dominant colors with hex values.
Return ONLY valid JSON, no markdown.`
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this AI-generated artwork:" },
              { type: "image_url", image_url: { url: image_url } }
            ]
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      await supabase.from("artworks").update({ analysis_status: "failed" }).eq("id", artwork_id);

      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from AI response (may have markdown fences)
    let analysis;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      analysis = JSON.parse(cleaned);
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      await supabase.from("artworks").update({ analysis_status: "failed" }).eq("id", artwork_id);
      return new Response(JSON.stringify({ error: "Failed to parse AI analysis" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Store analysis
    await supabase.from("artwork_analysis").upsert({
      artwork_id,
      ai_description: analysis.description || "",
      composition: analysis.composition || "",
      technical_details: analysis.technical_details || "",
      color_palette: analysis.color_palette || [],
      styles: analysis.styles || [],
      moods: analysis.moods || [],
    }, { onConflict: "artwork_id" });

    // Store categories
    if (analysis.categories?.length) {
      const cats = analysis.categories.map((c: any) => ({
        artwork_id,
        category: c.name,
        confidence: c.confidence,
      }));
      await supabase.from("artwork_categories").upsert(cats, { onConflict: "artwork_id,category" });
    }

    // Store tags
    if (analysis.tags?.length) {
      const tags = analysis.tags.map((t: string) => ({
        artwork_id,
        tag: t.toLowerCase(),
      }));
      await supabase.from("artwork_tags").upsert(tags, { onConflict: "artwork_id,tag" });
    }

    // Update title if user didn't provide one, and mark complete
    const updateData: any = { analysis_status: "complete" };
    if (analysis.title_suggestion) {
      // Only update title if current title is default
      const { data: artwork } = await supabase.from("artworks").select("title").eq("id", artwork_id).single();
      if (artwork?.title === "Untitled" || artwork?.title === "") {
        updateData.title = analysis.title_suggestion;
      }
    }
    await supabase.from("artworks").update(updateData).eq("id", artwork_id);

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-artwork error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

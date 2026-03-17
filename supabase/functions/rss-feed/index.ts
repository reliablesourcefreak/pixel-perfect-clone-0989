import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    const { data: artworks } = await supabase
      .from("artworks")
      .select("id, title, image_url, analysis_status, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    const siteUrl = req.headers.get("origin") || "https://pixel-perfect-clone-0989.lovable.app";
    const now = new Date().toUTCString();

    const items = (artworks || []).map((art) => `
    <item>
      <title><![CDATA[${art.title}]]></title>
      <link>${siteUrl}/gallery/${art.id}</link>
      <guid isPermaLink="true">${siteUrl}/gallery/${art.id}</guid>
      <pubDate>${new Date(art.created_at).toUTCString()}</pubDate>
      <description><![CDATA[<img src="${art.image_url}" /><br/>Status: ${art.analysis_status}]]></description>
      <enclosure url="${art.image_url}" type="image/png" />
    </item>`).join("\n");

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Orbit — AI Art Archive</title>
    <link>${siteUrl}</link>
    <description>A living archive of AI-generated artwork, automatically analyzed and categorized.</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${siteUrl}/rss" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

    return new Response(rss, {
      headers: { ...corsHeaders, "Content-Type": "application/rss+xml; charset=utf-8" },
    });
  } catch (e) {
    return new Response(`Error: ${e instanceof Error ? e.message : "Unknown"}`, { status: 500 });
  }
});

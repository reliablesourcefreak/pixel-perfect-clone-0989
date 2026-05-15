import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, json } from "../_shared/cors.ts";
import { authenticate, serviceClient, rateLimit } from "../_shared/auth.ts";

/**
 * Public read API authenticated by API key (x-api-key) or user JWT.
 * Resources: /artworks, /artworks/:id, /collections, /codex, /stories
 * Cursor pagination via ?cursor=<created_at>&limit=N (max 100).
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const ctx = await authenticate(req);
  if (!ctx) return json({ error: "Unauthorized" }, 401);
  if (!ctx.scopes?.includes("read")) return json({ error: "Missing 'read' scope" }, 403);
  const rateKey = ctx.apiKeyId ?? ctx.userId;
  if (!rateLimit(rateKey, 120, 120)) return json({ error: "Rate limit exceeded" }, 429);

  const url = new URL(req.url);
  const parts = url.pathname.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
  const idx = parts.indexOf("archive-public");
  const route = parts.slice(idx + 1);
  const cursor = url.searchParams.get("cursor");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "25"), 100);
  const sb = serviceClient();

  const paginate = <T extends Record<string, unknown>>(rows: T[]) => {
    const next = rows.length === limit ? rows[rows.length - 1].created_at : null;
    return { data: rows, next_cursor: next, limit };
  };

  try {
    if (route[0] === "artworks" && !route[1]) {
      let q = sb.from("artworks").select("id, title, image_url, width, height, analysis_status, is_favorited, created_at")
        .eq("user_id", ctx.userId).is("deleted_at", null).order("created_at", { ascending: false }).limit(limit);
      if (cursor) q = q.lt("created_at", cursor);
      const { data, error } = await q;
      if (error) throw error;
      return json(paginate(data ?? []));
    }
    if (route[0] === "artworks" && route[1]) {
      const { data, error } = await sb.from("artworks").select("*").eq("id", route[1]).eq("user_id", ctx.userId).maybeSingle();
      if (error) throw error;
      if (!data) return json({ error: "Not found" }, 404);
      const [{ data: analysis }, { data: tags }, { data: cats }] = await Promise.all([
        sb.from("artwork_analysis").select("*").eq("artwork_id", route[1]).maybeSingle(),
        sb.from("artwork_tags").select("tag").eq("artwork_id", route[1]),
        sb.from("artwork_categories").select("category, confidence").eq("artwork_id", route[1]),
      ]);
      return json({ ...data, analysis, tags: (tags || []).map((t) => t.tag), categories: cats ?? [] });
    }
    if (route[0] === "collections") {
      let q = sb.from("collections").select("id, name, description, is_smart, is_public, created_at")
        .eq("user_id", ctx.userId).is("deleted_at", null).order("created_at", { ascending: false }).limit(limit);
      if (cursor) q = q.lt("created_at", cursor);
      const { data, error } = await q;
      if (error) throw error;
      return json(paginate(data ?? []));
    }
    if (route[0] === "codex") {
      let q = sb.from("codex_entries").select("id, title, type, ai_summary, created_at")
        .eq("user_id", ctx.userId).is("deleted_at", null).order("created_at", { ascending: false }).limit(limit);
      if (cursor) q = q.lt("created_at", cursor);
      const { data, error } = await q;
      if (error) throw error;
      return json(paginate(data ?? []));
    }
    if (route[0] === "stories") {
      let q = sb.from("stories").select("id, title, status, ai_summary, created_at")
        .eq("user_id", ctx.userId).is("deleted_at", null).order("created_at", { ascending: false }).limit(limit);
      if (cursor) q = q.lt("created_at", cursor);
      const { data, error } = await q;
      if (error) throw error;
      return json(paginate(data ?? []));
    }
    if (route[0] === "me") {
      return json({ user_id: ctx.userId, via: ctx.via, scopes: ctx.scopes });
    }
    return json({ error: "Unknown route", available: ["/me", "/artworks", "/artworks/:id", "/collections", "/codex", "/stories"] }, 404);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});
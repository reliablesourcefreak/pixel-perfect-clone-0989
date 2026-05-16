import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, json } from "../_shared/cors.ts";
import { authenticate, serviceClient, logAudit, emitEvent } from "../_shared/auth.ts";

/**
 * Bulk operations. POST { op, artwork_ids, params }
 * ops: tag_add, tag_remove, move_to_collection, favorite, unfavorite, soft_delete, restore, reanalyze
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  const ctx = await authenticate(req);
  if (!ctx) return json({ error: "Unauthorized" }, 401);

  const body = await req.json().catch(() => ({}));
  const op = String(body.op || "");
  const ids: string[] = Array.isArray(body.artwork_ids) ? body.artwork_ids : [];
  if (!op) return json({ error: "op required" }, 400);
  if (!ids.length) return json({ error: "artwork_ids must be non-empty" }, 400);
  if (ids.length > 500) return json({ error: "max 500 ids per call" }, 400);

  const sb = serviceClient();
  // ownership check
  const { data: owned } = await sb.from("artworks").select("id").eq("user_id", ctx.userId).in("id", ids);
  const ownedIds = new Set((owned || []).map((a) => a.id));
  const valid = ids.filter((i) => ownedIds.has(i));
  if (!valid.length) return json({ error: "no matching owned artworks" }, 404);

  const result: Record<string, unknown> = { affected: valid.length, op };

  switch (op) {
    case "tag_add": {
      const tags: string[] = (body.params?.tags || []).map((t: string) => t.trim()).filter(Boolean);
      if (!tags.length) return json({ error: "params.tags required" }, 400);
      const rows = valid.flatMap((aid) => tags.map((tag) => ({ artwork_id: aid, tag })));
      await sb.from("artwork_tags").upsert(rows, { onConflict: "artwork_id,tag", ignoreDuplicates: true });
      result.tags = tags;
      break;
    }
    case "tag_remove": {
      const tags: string[] = body.params?.tags || [];
      await sb.from("artwork_tags").delete().in("artwork_id", valid).in("tag", tags);
      result.tags = tags;
      break;
    }
    case "move_to_collection": {
      const cid = body.params?.collection_id;
      if (!cid) return json({ error: "params.collection_id required" }, 400);
      const { data: col } = await sb.from("collections").select("id").eq("id", cid).eq("user_id", ctx.userId).maybeSingle();
      if (!col) return json({ error: "collection not found" }, 404);
      await sb.from("collection_artworks").insert(valid.map((aid) => ({ collection_id: cid, artwork_id: aid })));
      result.collection_id = cid;
      break;
    }
    case "favorite":
    case "unfavorite": {
      await sb.from("artworks").update({ is_favorited: op === "favorite" }).in("id", valid);
      break;
    }
    case "soft_delete": {
      await sb.from("artworks").update({ deleted_at: new Date().toISOString() }).in("id", valid);
      break;
    }
    case "restore": {
      await sb.from("artworks").update({ deleted_at: null }).in("id", valid);
      break;
    }
    case "reanalyze": {
      // enqueue background jobs rather than block
      await sb.from("background_jobs").insert(
        valid.map((aid) => ({ user_id: ctx.userId, kind: "reanalyze_artwork", payload: { artwork_id: aid } })),
      );
      result.queued = valid.length;
      break;
    }
    default:
      return json({ error: `unknown op '${op}'` }, 400);
  }

  await logAudit(ctx.userId, `bulk.${op}`, "artwork", undefined, { count: valid.length, ids: valid.slice(0, 25) });
  await emitEvent(ctx.userId, `bulk.${op}`, { artwork_ids: valid });
  return json(result);
});
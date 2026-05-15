import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, json } from "../_shared/cors.ts";
import { authenticate, serviceClient, emitEvent } from "../_shared/auth.ts";

/**
 * GET  /archive-jobs              -> list user's jobs
 * POST /archive-jobs              -> create job { kind, payload }
 * POST /archive-jobs?process=1    -> internal worker (cron-callable), runs up to 5 pending jobs
 */
async function processOne(jobId: string) {
  const sb = serviceClient();
  const { data: job } = await sb.from("background_jobs").select("*").eq("id", jobId).maybeSingle();
  if (!job || job.status !== "pending") return;
  await sb.from("background_jobs").update({ status: "running", started_at: new Date().toISOString() }).eq("id", job.id);

  try {
    let result: Record<string, unknown> = {};
    if (job.kind === "reanalyze_artwork") {
      const aid = job.payload?.artwork_id;
      // mark for re-analysis; the analyze-artwork function will pick this up when invoked from the UI
      await sb.from("artworks").update({ analysis_status: "pending" }).eq("id", aid).eq("user_id", job.user_id);
      result = { artwork_id: aid, marked: true };
    } else if (job.kind === "purge_deleted") {
      // purge soft-deleted rows older than 30 days
      const cutoff = new Date(Date.now() - 30 * 86400_000).toISOString();
      const { data: dead } = await sb.from("artworks").select("id").eq("user_id", job.user_id).lt("deleted_at", cutoff);
      const ids = (dead || []).map((d) => d.id);
      if (ids.length) await sb.from("artworks").delete().in("id", ids);
      result = { purged: ids.length };
    } else {
      throw new Error(`unknown job kind: ${job.kind}`);
    }

    await sb.from("background_jobs").update({ status: "done", progress: 100, result, finished_at: new Date().toISOString() }).eq("id", job.id);
    await emitEvent(job.user_id, `job.${job.kind}.done`, { job_id: job.id, result });
  } catch (e) {
    const err = e instanceof Error ? e.message : "unknown";
    await sb.from("background_jobs").update({ status: "failed", error: err, finished_at: new Date().toISOString() }).eq("id", job.id);
    await emitEvent(job.user_id, `job.${job.kind}.failed`, { job_id: job.id, error: err });
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const url = new URL(req.url);
  const sb = serviceClient();

  if (url.searchParams.get("process") === "1") {
    const { data: pending } = await sb.from("background_jobs").select("id").eq("status", "pending").lte("scheduled_at", new Date().toISOString()).limit(5);
    for (const p of pending || []) await processOne(p.id);
    return json({ processed: (pending || []).length });
  }

  const ctx = await authenticate(req);
  if (!ctx) return json({ error: "Unauthorized" }, 401);

  if (req.method === "GET") {
    const { data } = await sb.from("background_jobs").select("*").eq("user_id", ctx.userId).order("created_at", { ascending: false }).limit(50);
    return json({ jobs: data ?? [] });
  }
  if (req.method === "POST") {
    const body = await req.json().catch(() => ({}));
    if (!body.kind) return json({ error: "kind required" }, 400);
    const { data, error } = await sb.from("background_jobs").insert({ user_id: ctx.userId, kind: body.kind, payload: body.payload || {} }).select().single();
    if (error) return json({ error: error.message }, 400);
    return json(data, 201);
  }
  return json({ error: "Method not allowed" }, 405);
});
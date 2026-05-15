import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, json } from "../_shared/cors.ts";
import { authenticate, serviceClient, hmacSha256Hex, logAudit } from "../_shared/auth.ts";

/**
 * GET  /archive-webhooks            -> list user's webhooks
 * POST /archive-webhooks            -> create { url, events?, secret? }
 * DELETE /archive-webhooks?id=...   -> remove
 * POST /archive-webhooks?dispatch=1 -> internal dispatcher (cron-callable)
 */
function randomSecret(): string {
  const b = new Uint8Array(24);
  crypto.getRandomValues(b);
  return "whsec_" + Array.from(b).map((x) => x.toString(16).padStart(2, "0")).join("");
}

async function dispatchPending() {
  const sb = serviceClient();
  const { data: pending } = await sb
    .from("webhook_deliveries")
    .select("id, webhook_id, event_type, payload, attempt_count, webhooks!inner(url, secret, is_active)")
    .is("delivered_at", null)
    .lte("next_retry_at", new Date().toISOString())
    .lt("attempt_count", 5)
    .limit(50);

  let sent = 0;
  for (const d of pending || []) {
    // deno-lint-ignore no-explicit-any
    const hook = (d as any).webhooks;
    if (!hook?.is_active) continue;
    const body = JSON.stringify(d.payload);
    const sig = await hmacSha256Hex(hook.secret, body);
    let status = 0;
    let respBody = "";
    try {
      const r = await fetch(hook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Atelier-Event": d.event_type,
          "X-Atelier-Signature": `sha256=${sig}`,
          "X-Atelier-Delivery": d.id,
        },
        body,
        signal: AbortSignal.timeout(10000),
      });
      status = r.status;
      respBody = (await r.text()).slice(0, 1000);
    } catch (e) {
      respBody = e instanceof Error ? e.message : "fetch failed";
    }
    const ok = status >= 200 && status < 300;
    const attempt = d.attempt_count + 1;
    await sb.from("webhook_deliveries").update({
      response_status: status,
      response_body: respBody,
      attempt_count: attempt,
      delivered_at: ok ? new Date().toISOString() : null,
      next_retry_at: ok ? null : new Date(Date.now() + Math.pow(2, attempt) * 60_000).toISOString(),
    }).eq("id", d.id);
    sent++;
  }
  return sent;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const url = new URL(req.url);

  if (url.searchParams.get("dispatch") === "1") {
    const sent = await dispatchPending();
    return json({ dispatched: sent });
  }

  const ctx = await authenticate(req);
  if (!ctx || ctx.via !== "jwt") return json({ error: "Unauthorized" }, 401);
  const sb = serviceClient();

  if (req.method === "GET") {
    const { data } = await sb.from("webhooks").select("id, url, events, is_active, created_at").eq("user_id", ctx.userId).order("created_at", { ascending: false });
    return json({ webhooks: data ?? [] });
  }
  if (req.method === "POST") {
    const body = await req.json().catch(() => ({}));
    if (!body.url || !/^https?:\/\//.test(body.url)) return json({ error: "valid url required" }, 400);
    const events = Array.isArray(body.events) && body.events.length ? body.events : ["*"];
    const secret = body.secret || randomSecret();
    const { data, error } = await sb.from("webhooks").insert({ user_id: ctx.userId, url: body.url, events, secret }).select().single();
    if (error) return json({ error: error.message }, 400);
    await logAudit(ctx.userId, "webhook.created", "webhook", data.id, { url: body.url });
    return json({ ...data, secret_warning: "Store this secret to verify HMAC signatures." }, 201);
  }
  if (req.method === "DELETE") {
    const id = url.searchParams.get("id");
    if (!id) return json({ error: "id required" }, 400);
    await sb.from("webhooks").delete().eq("id", id).eq("user_id", ctx.userId);
    await logAudit(ctx.userId, "webhook.deleted", "webhook", id);
    return json({ ok: true });
  }
  return json({ error: "Method not allowed" }, 405);
});
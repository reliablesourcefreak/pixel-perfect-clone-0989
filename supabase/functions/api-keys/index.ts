import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, json } from "../_shared/cors.ts";
import { authenticate, serviceClient, sha256Hex, logAudit } from "../_shared/auth.ts";

function generateKey(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const b64 = btoa(String.fromCharCode(...bytes)).replace(/[+/=]/g, (c) => ({ "+": "-", "/": "_", "=": "" }[c]!));
  return `atelier_${b64}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const ctx = await authenticate(req);
  if (!ctx || ctx.via !== "jwt") return json({ error: "Unauthorized — JWT required" }, 401);
  const sb = serviceClient();

  if (req.method === "GET") {
    const { data } = await sb
      .from("api_keys")
      .select("id, name, key_prefix, scopes, is_active, last_used_at, expires_at, created_at")
      .eq("user_id", ctx.userId)
      .order("created_at", { ascending: false });
    return json({ keys: data ?? [] });
  }

  if (req.method === "POST") {
    const body = await req.json().catch(() => ({}));
    const name = (body.name || "Unnamed key").toString().slice(0, 100);
    const scopes = Array.isArray(body.scopes) && body.scopes.length ? body.scopes : ["read"];
    const expires_at = body.expires_at ?? null;
    const key = generateKey();
    const hash = await sha256Hex(key);
    const prefix = key.slice(0, 16);
    const { data, error } = await sb
      .from("api_keys")
      .insert({ user_id: ctx.userId, name, key_prefix: prefix, key_hash: hash, scopes, expires_at })
      .select()
      .single();
    if (error) return json({ error: error.message }, 400);
    await logAudit(ctx.userId, "api_key.created", "api_key", data.id, { name });
    return json({ id: data.id, name, key, key_prefix: prefix, scopes, expires_at, warning: "Store this key — it cannot be retrieved again." }, 201);
  }

  if (req.method === "DELETE") {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return json({ error: "id required" }, 400);
    const { error } = await sb.from("api_keys").delete().eq("id", id).eq("user_id", ctx.userId);
    if (error) return json({ error: error.message }, 400);
    await logAudit(ctx.userId, "api_key.revoked", "api_key", id);
    return json({ ok: true });
  }

  return json({ error: "Method not allowed" }, 405);
});
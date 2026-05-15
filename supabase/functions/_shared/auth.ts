import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export function serviceClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

export async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hmacSha256Hex(key: string, message: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export interface AuthCtx {
  userId: string;
  via: "jwt" | "api_key";
  apiKeyId?: string;
  scopes?: string[];
}

/** Authenticate either via Supabase JWT (Authorization: Bearer ...) or API key (x-api-key). */
export async function authenticate(req: Request): Promise<AuthCtx | null> {
  const sb = serviceClient();
  const apiKey = req.headers.get("x-api-key");
  if (apiKey) {
    const hash = await sha256Hex(apiKey);
    const { data: keyRow } = await sb
      .from("api_keys")
      .select("id, user_id, scopes, is_active, expires_at")
      .eq("key_hash", hash)
      .maybeSingle();
    if (!keyRow || !keyRow.is_active) return null;
    if (keyRow.expires_at && new Date(keyRow.expires_at) < new Date()) return null;
    // best-effort metering
    const today = new Date().toISOString().slice(0, 10);
    await sb.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", keyRow.id);
    await sb.rpc("increment_api_key_usage", { _key_id: keyRow.id, _day: today }).then(() => {}, () => {
      // fallback if RPC not present: upsert
      sb.from("api_key_usage").upsert(
        { api_key_id: keyRow.id, day: today, request_count: 1 },
        { onConflict: "api_key_id,day", ignoreDuplicates: false },
      );
    });
    return { userId: keyRow.user_id, via: "api_key", apiKeyId: keyRow.id, scopes: keyRow.scopes };
  }

  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );
  const { data, error } = await userClient.auth.getUser();
  if (error || !data.user) return null;
  return { userId: data.user.id, via: "jwt", scopes: ["read", "write"] };
}

/** In-memory token bucket per user — best-effort. Process-local, resets on cold start. */
const buckets = new Map<string, { tokens: number; updated: number }>();
export function rateLimit(key: string, ratePerMin = 60, burst = 60): boolean {
  const now = Date.now();
  const refill = ratePerMin / 60000;
  const b = buckets.get(key) ?? { tokens: burst, updated: now };
  b.tokens = Math.min(burst, b.tokens + (now - b.updated) * refill);
  b.updated = now;
  if (b.tokens < 1) {
    buckets.set(key, b);
    return false;
  }
  b.tokens -= 1;
  buckets.set(key, b);
  return true;
}

export async function logAudit(
  userId: string,
  action: string,
  entityType: string,
  entityId?: string,
  metadata: Record<string, unknown> = {},
) {
  const sb = serviceClient();
  await sb.from("audit_log").insert({ user_id: userId, action, entity_type: entityType, entity_id: entityId ?? null, metadata });
}

export async function emitEvent(
  userId: string,
  eventType: string,
  payload: Record<string, unknown>,
) {
  const sb = serviceClient();
  const { data: hooks } = await sb
    .from("webhooks")
    .select("id, events")
    .eq("user_id", userId)
    .eq("is_active", true);
  const matching = (hooks || []).filter((h) => h.events.includes("*") || h.events.includes(eventType));
  if (!matching.length) return;
  await sb.from("webhook_deliveries").insert(
    matching.map((h) => ({
      webhook_id: h.id,
      event_type: eventType,
      payload: { event: eventType, user_id: userId, timestamp: new Date().toISOString(), data: payload },
      next_retry_at: new Date().toISOString(),
    })),
  );
}
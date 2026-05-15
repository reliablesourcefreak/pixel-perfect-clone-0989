import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const URL = `${Deno.env.get("VITE_SUPABASE_URL")}/functions/v1/openapi`;
const KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

Deno.test("openapi returns 3.1 spec", async () => {
  const r = await fetch(URL, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
  const body = await r.json();
  assertEquals(r.status, 200);
  assertEquals(body.openapi, "3.1.0");
});
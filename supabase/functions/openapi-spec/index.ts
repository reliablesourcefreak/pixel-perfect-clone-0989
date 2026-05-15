import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const PROJECT = Deno.env.get("SUPABASE_URL")!.replace(/\/$/, "");

const spec = {
  openapi: "3.1.0",
  info: {
    title: "Atelier Archive API",
    version: "2.0.0",
    description: "Read & manage your private art archive. Authenticate with `x-api-key` (issue at /api-keys) or a Supabase JWT.",
  },
  servers: [{ url: `${PROJECT}/functions/v1` }],
  components: {
    securitySchemes: {
      apiKey: { type: "apiKey", in: "header", name: "x-api-key" },
      bearer: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
  },
  security: [{ apiKey: [] }, { bearer: [] }],
  paths: {
    "/archive-public/me": { get: { summary: "Identify caller" } },
    "/archive-public/artworks": {
      get: {
        summary: "List artworks (cursor paginated)",
        parameters: [
          { name: "cursor", in: "query", schema: { type: "string", format: "date-time" } },
          { name: "limit", in: "query", schema: { type: "integer", maximum: 100, default: 25 } },
        ],
      },
    },
    "/archive-public/artworks/{id}": { get: { parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }] } },
    "/archive-public/collections": { get: { summary: "List collections" } },
    "/archive-public/codex": { get: { summary: "List codex entries" } },
    "/archive-public/stories": { get: { summary: "List stories" } },
    "/archive-search": { post: { summary: "Unified search" } },
    "/archive-export": { get: { summary: "Export archive" } },
    "/archive-stats": { get: { summary: "Aggregate stats" } },
    "/archive-bulk": { post: { summary: "Bulk artwork operations" } },
    "/archive-jobs": { get: {}, post: { summary: "Enqueue background job" } },
    "/archive-pdf": { get: { summary: "Printable catalog" } },
    "/api-keys": { get: {}, post: { summary: "Issue API key" }, delete: { summary: "Revoke API key" } },
    "/archive-webhooks": { get: {}, post: { summary: "Register webhook" }, delete: {} },
  },
};

serve((req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  return new Response(JSON.stringify(spec, null, 2), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
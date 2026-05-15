import { useMemo, useState } from "react";
import {
  FileCode2,
  Lock,
  Unlock,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Database,
  Play,
  AlertTriangle,
  GitBranch,
  Gauge,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const FN_BASE = `${SUPABASE_URL}/functions/v1`;

type Method = "POST" | "GET";

interface Endpoint {
  method: Method;
  path: string;
  title: string;
  description: string;
  auth: "required" | "none";
  queryParams?: { field: string; type: string; required: boolean; description: string }[];
  requestBody?: { field: string; type: string; required: boolean; description: string }[];
  responseFields?: { field: string; type: string; description: string }[];
  exampleRequest?: string;
  exampleResponse?: string;
  notes?: string[];
  playground?: { defaultBody?: string; defaultQuery?: string };
}

const ENDPOINTS: Endpoint[] = [
  {
    method: "POST",
    path: "/analyze-artwork",
    title: "Analyze Artwork",
    description:
      "Processes an artwork image through multimodal AI to extract visual metadata: mood classifications, style labels, color palette, composition analysis, and a natural-language description.",
    auth: "none",
    requestBody: [
      { field: "imageUrl", type: "string", required: true, description: "Public URL of the artwork image to analyze." },
      { field: "artworkId", type: "string (UUID)", required: true, description: "ID of the artwork record in the database." },
    ],
    responseFields: [
      { field: "success", type: "boolean", description: "Whether analysis completed successfully." },
      { field: "analysis.moods", type: "string[]", description: "Detected mood labels." },
      { field: "analysis.styles", type: "string[]", description: "Style classifications." },
      { field: "analysis.color_palette", type: "object[]", description: "Extracted colors with hex values and names." },
      { field: "analysis.composition", type: "string", description: "Composition analysis description." },
      { field: "analysis.ai_description", type: "string", description: "AI-generated natural-language description." },
    ],
    exampleRequest: JSON.stringify(
      { imageUrl: "https://storage.example.com/art/painting.jpg", artworkId: "550e8400-e29b-41d4-a716-446655440000" },
      null,
      2,
    ),
    exampleResponse: JSON.stringify(
      {
        success: true,
        analysis: {
          moods: ["contemplative", "serene"],
          styles: ["impressionism", "landscape"],
          color_palette: [{ hex: "#2E4057", name: "Dark Slate" }],
          composition: "Rule of thirds with strong horizon line...",
          ai_description: "A tranquil landscape featuring soft brush strokes...",
        },
      },
      null,
      2,
    ),
    notes: [
      "Updates artworks.analysis_status to 'completed' on success.",
      "Writes results to artwork_analysis, artwork_tags, artwork_categories.",
      "Uses Gemini via the Lovable AI Gateway.",
    ],
    playground: {
      defaultBody: JSON.stringify({ imageUrl: "", artworkId: "" }, null, 2),
    },
  },
  {
    method: "POST",
    path: "/ask-archive",
    title: "Ask the Archive",
    description:
      "Streaming conversational AI endpoint. Gathers context from the entire archive and responds to natural-language queries about patterns, themes, and connections.",
    auth: "required",
    requestBody: [
      {
        field: "messages",
        type: "{ role: string; content: string }[]",
        required: true,
        description: "Chat history in OpenAI message format.",
      },
    ],
    responseFields: [
      { field: "Stream", type: "text/event-stream", description: "SSE stream of OpenAI-compatible chat completion chunks." },
    ],
    exampleRequest: JSON.stringify(
      { messages: [{ role: "user", content: "What moods appear most across my artworks?" }] },
      null,
      2,
    ),
    exampleResponse: `data: {"choices":[{"delta":{"content":"Based on your archive..."}}]}\n\ndata: [DONE]`,
    notes: [
      "Streams via SSE — parse with EventSource or chunked reader.",
      "Builds context from up to 100 artworks, 500 tags, 50 codex/stories/collections.",
      "Returns 429 on rate limit and 402 when AI credits are exhausted.",
    ],
    playground: {
      defaultBody: JSON.stringify(
        { messages: [{ role: "user", content: "Summarize the dominant moods in my archive." }] },
        null,
        2,
      ),
    },
  },
  {
    method: "GET",
    path: "/archive-export",
    title: "Archive Export",
    description:
      "Streams a downloadable export of artworks with embedded analysis, tags, and categories. Supports JSON or CSV; can be scoped to a collection or user.",
    auth: "none",
    queryParams: [
      { field: "format", type: "string", required: false, description: "'json' (default) or 'csv'." },
      { field: "collection_id", type: "string (UUID)", required: false, description: "Restrict export to a single collection." },
      { field: "user_id", type: "string (UUID)", required: false, description: "Restrict export to a single user's archive." },
    ],
    responseFields: [
      { field: "generated_at", type: "string (ISO)", description: "Server timestamp at which the snapshot was assembled." },
      { field: "count", type: "number", description: "Number of artworks included." },
      { field: "artworks[]", type: "object[]", description: "Each artwork plus its tags, categories, and analysis." },
    ],
    exampleResponse: JSON.stringify(
      {
        generated_at: "2026-05-12T11:42:00.000Z",
        count: 1,
        scope: { collection_id: null, user_id: null },
        artworks: [
          {
            id: "...",
            title: "Untitled",
            tags: ["dawn", "fog"],
            categories: [{ category: "landscape", confidence: 0.94 }],
            analysis: { moods: ["serene"], styles: ["impressionism"] },
          },
        ],
      },
      null,
      2,
    ),
    notes: [
      "Limit 1000 artworks per call. Paginate by user_id or collection_id.",
      "CSV flattens arrays with the | separator.",
      "Response sets Content-Disposition for direct browser download.",
    ],
    playground: {
      defaultQuery: "format=json",
    },
  },
  {
    method: "POST",
    path: "/archive-search",
    title: "Unified Search",
    description:
      "Cross-archive search across artworks (titles + tags), codex entries, stories, and collections. Returns ranked hits with snippets and type discriminators.",
    auth: "none",
    queryParams: [
      { field: "q", type: "string", required: true, description: "Query string. Minimum 2 characters." },
      { field: "types", type: "string", required: false, description: "Comma-separated subset of artwork,codex,story,collection." },
      { field: "limit", type: "number", required: false, description: "Max hits returned (default 20, cap 100)." },
    ],
    requestBody: [
      { field: "q", type: "string", required: true, description: "Same as the q query parameter." },
      { field: "types", type: "string[]", required: false, description: "Subset of entity types to search." },
      { field: "limit", type: "number", required: false, description: "Max hits." },
    ],
    responseFields: [
      { field: "query", type: "string", description: "The normalized search term." },
      { field: "hits[].type", type: "'artwork' | 'codex' | 'story' | 'collection'", description: "Entity kind." },
      { field: "hits[].title", type: "string", description: "Display title for the hit." },
      { field: "hits[].snippet", type: "string", description: "Highlighted excerpt up to 160 chars." },
      { field: "hits[].score", type: "number", description: "Relevance score 0–100." },
    ],
    exampleRequest: JSON.stringify({ q: "fog", types: ["artwork", "codex"], limit: 10 }, null, 2),
    exampleResponse: JSON.stringify(
      {
        query: "fog",
        types: ["artwork", "codex"],
        total: 2,
        hits: [
          { type: "artwork", id: "...", title: "Morning Fog", snippet: "Morning Fog", score: 80 },
          { type: "codex", id: "...", title: "Field Notes", snippet: "fog rolling across the valley...", score: 40 },
        ],
      },
      null,
      2,
    ),
    notes: [
      "Supports both GET (querystring) and POST (JSON body).",
      "Scoring is client-side ILIKE prefix-weighted — replace with pg_trgm for production.",
    ],
    playground: {
      defaultBody: JSON.stringify({ q: "", limit: 10 }, null, 2),
      defaultQuery: "q=&limit=10",
    },
  },
  {
    method: "GET",
    path: "/archive-stats",
    title: "Archive Statistics",
    description:
      "Returns aggregate analytics across the archive: counts, top moods/styles/tags/categories, palette frequency, codex/story breakdowns, and a daily timeline.",
    auth: "none",
    queryParams: [
      { field: "user_id", type: "string (UUID)", required: false, description: "Restrict aggregation to a single user." },
    ],
    responseFields: [
      { field: "counts", type: "object", description: "Totals for artworks, analyzed, favorited, codex, stories, collections." },
      { field: "top_moods", type: "{ key, count }[]", description: "Top 10 moods by frequency." },
      { field: "top_styles", type: "{ key, count }[]", description: "Top 10 styles." },
      { field: "top_tags", type: "{ key, count }[]", description: "Top 20 tags." },
      { field: "palette_aggregate", type: "{ key, count }[]", description: "Most frequent hex colors across analyses." },
      { field: "timeline", type: "{ date, count }[]", description: "Artworks added per day, oldest first." },
    ],
    exampleResponse: JSON.stringify(
      {
        counts: { artworks: 42, analyzed: 40, favorited: 7, codex_entries: 5, stories: 3, collections: 4 },
        top_moods: [{ key: "serene", count: 12 }, { key: "melancholic", count: 9 }],
        top_styles: [{ key: "impressionism", count: 14 }],
      },
      null,
      2,
    ),
    notes: ["Caps at 2000 artworks per scope. For larger archives, paginate by user_id."],
    playground: { defaultQuery: "" },
  },
  {
    method: "GET",
    path: "/rss-feed",
    title: "RSS Feed",
    description: "RSS 2.0 XML feed of the latest public artworks.",
    auth: "none",
    responseFields: [
      { field: "XML", type: "application/rss+xml", description: "Standard RSS 2.0 feed document." },
    ],
    exampleResponse: `<?xml version="1.0"?>\n<rss version="2.0">\n  <channel>...</channel>\n</rss>`,
    notes: ["Returns the 50 most recent artworks."],
  },
  {
    method: "GET",
    path: "/archive-public/{resource}",
    title: "Public REST API",
    description:
      "Authenticated read API for external integrations. Supports x-api-key header (issued via /api-keys) or Supabase JWT. Cursor pagination via ?cursor=<created_at>&limit=N (max 100). Resources: /me, /artworks, /artworks/:id, /collections, /codex, /stories.",
    auth: "required",
    queryParams: [
      { field: "cursor", type: "string (ISO timestamp)", required: false, description: "Pass the previous response's next_cursor to fetch the next page." },
      { field: "limit", type: "integer", required: false, description: "Page size, default 25, max 100." },
    ],
    responseFields: [
      { field: "data", type: "object[]", description: "Page of resources." },
      { field: "next_cursor", type: "string|null", description: "Pass back as ?cursor= to continue. Null when no more pages." },
      { field: "limit", type: "integer", description: "Echo of the limit applied." },
    ],
    exampleResponse: JSON.stringify({ data: [{ id: "uuid", title: "Untitled", created_at: "2026-05-15T10:00:00Z" }], next_cursor: "2026-05-15T10:00:00Z", limit: 25 }, null, 2),
    notes: ["Soft-deleted rows are filtered out automatically.", "Per-key rate limit: 120 req/min (best-effort token bucket)."],
  },
  {
    method: "POST",
    path: "/archive-bulk",
    title: "Bulk Operations",
    description: "Apply an operation to up to 500 artworks at once. Long-running ops (reanalyze) are enqueued as background jobs.",
    auth: "required",
    requestBody: [
      { field: "op", type: "string", required: true, description: "tag_add | tag_remove | move_to_collection | favorite | unfavorite | soft_delete | restore | reanalyze" },
      { field: "artwork_ids", type: "string[]", required: true, description: "Up to 500 artwork IDs the caller owns." },
      { field: "params", type: "object", required: false, description: "Op-specific: { tags: [] } or { collection_id }" },
    ],
    exampleRequest: JSON.stringify({ op: "tag_add", artwork_ids: ["uuid1", "uuid2"], params: { tags: ["wip", "studio"] } }, null, 2),
    exampleResponse: JSON.stringify({ affected: 2, op: "tag_add", tags: ["wip", "studio"] }, null, 2),
    notes: ["Emits a webhook event `bulk.<op>` for each call.", "Writes an entry to the audit log."],
    playground: { defaultBody: JSON.stringify({ op: "favorite", artwork_ids: ["<artwork-uuid>"] }, null, 2) },
  },
  {
    method: "POST",
    path: "/archive-jobs",
    title: "Background Jobs",
    description: "GET to list your jobs, POST to enqueue. Workers run every minute via pg_cron and process up to 5 pending jobs per tick. Kinds: reanalyze_artwork, purge_deleted.",
    auth: "required",
    requestBody: [
      { field: "kind", type: "string", required: true, description: "reanalyze_artwork | purge_deleted" },
      { field: "payload", type: "object", required: false, description: "Job-specific data." },
    ],
    exampleRequest: JSON.stringify({ kind: "reanalyze_artwork", payload: { artwork_id: "uuid" } }, null, 2),
    exampleResponse: JSON.stringify({ id: "uuid", kind: "reanalyze_artwork", status: "pending", progress: 0 }, null, 2),
  },
  {
    method: "POST",
    path: "/api-keys",
    title: "API Keys",
    description: "Issue, list, and revoke long-lived API keys for the public REST API. The full key value is shown only once at creation time.",
    auth: "required",
    requestBody: [
      { field: "name", type: "string", required: false, description: "Human label, max 100 chars." },
      { field: "scopes", type: "string[]", required: false, description: "Default ['read']." },
      { field: "expires_at", type: "string (ISO)", required: false, description: "Optional expiry." },
    ],
    exampleResponse: JSON.stringify({ id: "uuid", name: "Personal site", key: "atelier_AbCd...XyZ", key_prefix: "atelier_AbCd...", scopes: ["read"], warning: "Store this key — it cannot be retrieved again." }, null, 2),
    notes: ["Hashed with SHA-256 before storage; only the prefix is recoverable.", "Revoke with DELETE /api-keys?id=<uuid>."],
  },
  {
    method: "POST",
    path: "/archive-webhooks",
    title: "Webhooks",
    description: "Subscribe to events. Deliveries are signed with HMAC-SHA-256 (header X-Atelier-Signature: sha256=<hex>). Retried up to 5 times with exponential backoff.",
    auth: "required",
    requestBody: [
      { field: "url", type: "string (https)", required: true, description: "Receiver endpoint." },
      { field: "events", type: "string[]", required: false, description: "Event filter, default ['*']. e.g. ['bulk.tag_add', 'job.reanalyze_artwork.done']" },
      { field: "secret", type: "string", required: false, description: "Auto-generated if omitted." },
    ],
    exampleResponse: JSON.stringify({ id: "uuid", url: "https://example.com/hook", events: ["*"], secret: "whsec_...", secret_warning: "Store this secret to verify HMAC signatures." }, null, 2),
    notes: ["Verify signatures: hmac_sha256(secret, raw_body) === header.split('=')[1]", "Pending deliveries are flushed every minute by pg_cron."],
  },
  {
    method: "GET",
    path: "/archive-pdf",
    title: "Catalog PDF",
    description: "Server-rendered printable HTML catalog of an archive or collection. Open in a browser and print-to-PDF (auto-triggered).",
    auth: "required",
    queryParams: [
      { field: "collection_id", type: "string (UUID)", required: false, description: "Scope to a single collection. Omit for the full archive." },
    ],
    notes: ["Returns text/html with print CSS optimized for A4."],
  },
  {
    method: "GET",
    path: "/openapi",
    title: "OpenAPI Spec",
    description: "Returns the OpenAPI 3.1 JSON spec for all endpoints. Import into Postman, Insomnia, or any OpenAPI-aware client.",
    auth: "none",
    exampleResponse: '{ "openapi": "3.1.0", "info": { "title": "Atelier Archive API" }, "paths": { ... } }',
  },
];

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-6 px-2 font-mono text-[10px] rounded-none"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
      {copied ? "Copied" : label}
    </Button>
  );
}

function buildSamples(ep: Endpoint) {
  const url = `${FN_BASE}${ep.path}`;
  const authHeader = ep.auth === "required" ? '  -H "Authorization: Bearer $TOKEN" \\\n' : "";
  const bodyJson = ep.exampleRequest || ep.playground?.defaultBody;
  const query = ep.playground?.defaultQuery || (ep.queryParams?.length ? "key=value" : "");
  const fullUrl = ep.method === "GET" && query ? `${url}?${query}` : url;

  const curl =
    ep.method === "GET"
      ? `curl -X GET "${fullUrl}" \\\n${authHeader}  -H "apikey: $SUPABASE_ANON_KEY"`
      : `curl -X POST "${url}" \\\n${authHeader}  -H "Content-Type: application/json" \\\n  -H "apikey: $SUPABASE_ANON_KEY" \\\n  -d '${bodyJson || "{}"}'`;

  const fnName = ep.path.replace(/^\//, "");
  const js =
    ep.method === "GET"
      ? `// Direct fetch (GET endpoints)\nconst res = await fetch(\n  \`\${SUPABASE_URL}/functions/v1${ep.path}${query ? `?${query}` : ""}\`,\n  { headers: { apikey: SUPABASE_ANON_KEY } },\n);\nconst data = await res.json();`
      : `import { supabase } from "@/integrations/supabase/client";\n\nconst { data, error } = await supabase.functions.invoke("${fnName}", {\n  body: ${bodyJson || "{}"},\n});`;

  const py =
    ep.method === "GET"
      ? `import os, requests\n\nurl = f"{os.environ['SUPABASE_URL']}/functions/v1${ep.path}${query ? `?${query}` : ""}"\nheaders = {"apikey": os.environ["SUPABASE_ANON_KEY"]}\nr = requests.get(url, headers=headers)\nprint(r.json())`
      : `import os, json, requests\n\nurl = f"{os.environ['SUPABASE_URL']}/functions/v1${ep.path}"\nheaders = {\n  "Content-Type": "application/json",\n  "apikey": os.environ["SUPABASE_ANON_KEY"],\n${ep.auth === "required" ? '  "Authorization": f"Bearer {os.environ[\\"USER_JWT\\"]}",\n' : ""}}\nr = requests.post(url, headers=headers, data=json.dumps(${bodyJson || "{}"}))\nprint(r.json())`;

  return { curl, js, py };
}

function Playground({ ep }: { ep: Endpoint }) {
  const [body, setBody] = useState(ep.playground?.defaultBody || "");
  const [query, setQuery] = useState(ep.playground?.defaultQuery || "");
  const [running, setRunning] = useState(false);
  const [response, setResponse] = useState<string>("");
  const [status, setStatus] = useState<number | null>(null);

  const run = async () => {
    setRunning(true);
    setResponse("");
    setStatus(null);
    try {
      const fnName = ep.path.replace(/^\//, "");
      if (ep.method === "POST") {
        let parsed: unknown = {};
        if (body.trim()) {
          try {
            parsed = JSON.parse(body);
          } catch {
            toast.error("Request body is not valid JSON");
            setRunning(false);
            return;
          }
        }
        const { data, error } = await supabase.functions.invoke(fnName, { body: parsed });
        if (error) {
          setStatus(error.context?.status ?? 500);
          setResponse(typeof error === "object" ? JSON.stringify(error, null, 2) : String(error));
        } else {
          setStatus(200);
          setResponse(typeof data === "string" ? data : JSON.stringify(data, null, 2));
        }
      } else {
        const url = `${FN_BASE}${ep.path}${query ? `?${query}` : ""}`;
        const { data: { session } } = await supabase.auth.getSession();
        const headers: Record<string, string> = {
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
        };
        if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
        const r = await fetch(url, { headers });
        setStatus(r.status);
        const ct = r.headers.get("content-type") || "";
        const text = await r.text();
        if (ct.includes("application/json")) {
          try {
            setResponse(JSON.stringify(JSON.parse(text), null, 2));
          } catch {
            setResponse(text);
          }
        } else {
          setResponse(text.slice(0, 8000));
        }
      }
    } catch (e) {
      setStatus(500);
      setResponse(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="border border-border bg-secondary/20 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="section-label">Try it</span>
        <Button
          size="sm"
          variant="outline"
          className="rounded-none font-mono text-[10px] h-7"
          onClick={run}
          disabled={running}
        >
          <Play className="h-3 w-3 mr-1" />
          {running ? "Running…" : "Send request"}
        </Button>
      </div>
      {ep.method === "GET" && (
        <div>
          <span className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase block mb-1">
            Query string
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="key=value&other=value"
            className="w-full bg-background border border-border px-3 py-2 font-mono text-xs"
          />
        </div>
      )}
      {ep.method === "POST" && (
        <div>
          <span className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase block mb-1">
            Request body (JSON)
          </span>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            className="font-mono text-xs rounded-none"
          />
        </div>
      )}
      {response && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
              Response {status !== null && <span className="text-accent ml-2">{status}</span>}
            </span>
            <CopyButton text={response} />
          </div>
          <pre className="bg-background border border-border p-3 overflow-auto max-h-72">
            <code className="font-mono text-xs text-foreground">{response}</code>
          </pre>
        </div>
      )}
    </div>
  );
}

function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
  const [expanded, setExpanded] = useState(false);
  const samples = useMemo(() => buildSamples(endpoint), [endpoint]);

  return (
    <div id={`ep-${endpoint.path.slice(1)}`} className="border border-border bg-background scroll-mt-24">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-5 flex items-center gap-4 text-left hover:bg-secondary/30 transition-colors"
      >
        <Badge
          variant="outline"
          className={`font-mono text-[10px] tracking-wider px-2 py-0.5 rounded-none ${
            endpoint.method === "POST" ? "border-accent text-accent" : "border-primary text-primary"
          }`}
        >
          {endpoint.method}
        </Badge>
        <code className="font-mono text-xs text-foreground">{endpoint.path}</code>
        <span className="font-mono text-[10px] text-muted-foreground tracking-wide hidden md:inline">
          {endpoint.title}
        </span>
        <span className="ml-auto flex items-center gap-3">
          {endpoint.auth === "required" ? (
            <Lock className="h-3 w-3 text-muted-foreground" strokeWidth={1.5} />
          ) : (
            <Unlock className="h-3 w-3 text-muted-foreground" strokeWidth={1.5} />
          )}
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 space-y-6 border-t border-border pt-5">
              <div>
                <h3 className="font-serif text-lg text-foreground">{endpoint.title}</h3>
                <p className="font-mono text-xs text-muted-foreground mt-2 tracking-wide leading-relaxed">
                  {endpoint.description}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
                  Auth:
                </span>
                <Badge
                  variant={endpoint.auth === "required" ? "default" : "secondary"}
                  className="rounded-none font-mono text-[10px]"
                >
                  {endpoint.auth === "required" ? "Bearer Token Required" : "Public"}
                </Badge>
              </div>

              {endpoint.queryParams && (
                <div>
                  <span className="section-label block mb-3">Query Parameters</span>
                  <div className="border border-border divide-y divide-border">
                    {endpoint.queryParams.map((f) => (
                      <div key={f.field} className="px-4 py-3 flex flex-wrap items-start gap-3">
                        <code className="font-mono text-xs text-foreground shrink-0">{f.field}</code>
                        <Badge variant="outline" className="rounded-none font-mono text-[10px] shrink-0">
                          {f.type}
                        </Badge>
                        {f.required && (
                          <Badge className="rounded-none font-mono text-[10px] bg-accent text-accent-foreground shrink-0">
                            required
                          </Badge>
                        )}
                        <span className="font-mono text-xs text-muted-foreground tracking-wide">
                          {f.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {endpoint.requestBody && (
                <div>
                  <span className="section-label block mb-3">Request Body</span>
                  <div className="border border-border divide-y divide-border">
                    {endpoint.requestBody.map((f) => (
                      <div key={f.field} className="px-4 py-3 flex flex-wrap items-start gap-3">
                        <code className="font-mono text-xs text-foreground shrink-0">{f.field}</code>
                        <Badge variant="outline" className="rounded-none font-mono text-[10px] shrink-0">
                          {f.type}
                        </Badge>
                        {f.required && (
                          <Badge className="rounded-none font-mono text-[10px] bg-accent text-accent-foreground shrink-0">
                            required
                          </Badge>
                        )}
                        <span className="font-mono text-xs text-muted-foreground tracking-wide">
                          {f.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {endpoint.responseFields && (
                <div>
                  <span className="section-label block mb-3">Response</span>
                  <div className="border border-border divide-y divide-border">
                    {endpoint.responseFields.map((f) => (
                      <div key={f.field} className="px-4 py-3 flex flex-wrap items-start gap-3">
                        <code className="font-mono text-xs text-foreground shrink-0">{f.field}</code>
                        <Badge variant="outline" className="rounded-none font-mono text-[10px] shrink-0">
                          {f.type}
                        </Badge>
                        <span className="font-mono text-xs text-muted-foreground tracking-wide">
                          {f.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <span className="section-label block mb-2">Code Samples</span>
                <Tabs defaultValue="curl" className="w-full">
                  <TabsList className="rounded-none bg-secondary/40 h-8">
                    <TabsTrigger value="curl" className="rounded-none font-mono text-[10px] uppercase tracking-widest">
                      cURL
                    </TabsTrigger>
                    <TabsTrigger value="js" className="rounded-none font-mono text-[10px] uppercase tracking-widest">
                      JavaScript
                    </TabsTrigger>
                    <TabsTrigger value="py" className="rounded-none font-mono text-[10px] uppercase tracking-widest">
                      Python
                    </TabsTrigger>
                  </TabsList>
                  {([
                    ["curl", samples.curl],
                    ["js", samples.js],
                    ["py", samples.py],
                  ] as const).map(([k, v]) => (
                    <TabsContent key={k} value={k} className="mt-3">
                      <div className="flex items-center justify-end mb-1">
                        <CopyButton text={v} />
                      </div>
                      <pre className="bg-secondary/50 border border-border p-4 overflow-x-auto">
                        <code className="font-mono text-xs text-foreground whitespace-pre">{v}</code>
                      </pre>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>

              {endpoint.exampleResponse && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="section-label">Example Response</span>
                    <CopyButton text={endpoint.exampleResponse} />
                  </div>
                  <pre className="bg-secondary/50 border border-border p-4 overflow-x-auto">
                    <code className="font-mono text-xs text-foreground">{endpoint.exampleResponse}</code>
                  </pre>
                </div>
              )}

              {endpoint.playground && <Playground ep={endpoint} />}

              {endpoint.notes && (
                <div>
                  <span className="section-label block mb-2">Notes</span>
                  <ul className="space-y-1.5">
                    {endpoint.notes.map((note, i) => (
                      <li
                        key={i}
                        className="font-mono text-xs text-muted-foreground tracking-wide flex items-start gap-2"
                      >
                        <span className="text-accent mt-0.5">—</span>
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const SCHEMA: { name: string; purpose: string; cols: { name: string; type: string; note?: string }[]; rls: string }[] = [
  {
    name: "artworks",
    purpose: "Primary record per uploaded image.",
    cols: [
      { name: "id", type: "uuid (pk)" },
      { name: "user_id", type: "uuid", note: "owner; required for write" },
      { name: "title", type: "text" },
      { name: "image_url", type: "text" },
      { name: "width / height", type: "int" },
      { name: "file_size_bytes", type: "bigint" },
      { name: "analysis_status", type: "text", note: "pending | running | completed | failed" },
      { name: "is_favorited", type: "boolean" },
    ],
    rls: "Public read; insert/update/delete restricted to auth.uid() = user_id.",
  },
  {
    name: "artwork_analysis",
    purpose: "AI-generated metadata, one row per artwork.",
    cols: [
      { name: "artwork_id", type: "uuid" },
      { name: "moods", type: "text[]" },
      { name: "styles", type: "text[]" },
      { name: "color_palette", type: "jsonb", note: "[{ hex, name }]" },
      { name: "composition", type: "text" },
      { name: "ai_description", type: "text" },
      { name: "technical_details", type: "text" },
    ],
    rls: "Public read; write/update only when caller owns the parent artwork. No delete.",
  },
  {
    name: "artwork_tags",
    purpose: "Free-form tags emitted by the analyzer or added manually.",
    cols: [
      { name: "artwork_id", type: "uuid" },
      { name: "tag", type: "text" },
    ],
    rls: "Public read; insert/delete restricted to artwork owner. No update.",
  },
  {
    name: "artwork_categories",
    purpose: "Categorical labels with confidence scores.",
    cols: [
      { name: "artwork_id", type: "uuid" },
      { name: "category", type: "text" },
      { name: "confidence", type: "numeric" },
    ],
    rls: "Public read; insert/delete by owner. No update.",
  },
  {
    name: "collections",
    purpose: "Manual or smart (jsonb-rule) groupings of artworks.",
    cols: [
      { name: "name", type: "text" },
      { name: "description", type: "text" },
      { name: "is_smart", type: "boolean" },
      { name: "smart_rules", type: "jsonb" },
      { name: "is_public", type: "boolean" },
      { name: "is_pinned", type: "boolean" },
      { name: "color", type: "text" },
      { name: "cover_image_url", type: "text" },
    ],
    rls: "Public read; full CRUD restricted to owner.",
  },
  {
    name: "collection_artworks",
    purpose: "Many-to-many link between collections and artworks.",
    cols: [
      { name: "collection_id", type: "uuid" },
      { name: "artwork_id", type: "uuid" },
      { name: "added_at", type: "timestamptz" },
    ],
    rls: "Public read; insert/delete restricted to collection owner.",
  },
  {
    name: "codex_entries",
    purpose: "Markdown narrative entries (notes, references, character sheets).",
    cols: [
      { name: "title", type: "text" },
      { name: "type", type: "text" },
      { name: "content", type: "text (markdown)" },
      { name: "ai_summary", type: "text" },
    ],
    rls: "Public read; full CRUD restricted to owner.",
  },
  {
    name: "codex_artwork_links",
    purpose: "Cross-references between codex entries and artworks.",
    cols: [
      { name: "codex_entry_id", type: "uuid" },
      { name: "artwork_id", type: "uuid" },
    ],
    rls: "Public read; insert/delete by codex entry owner. No update.",
  },
  {
    name: "stories",
    purpose: "Ordered scene-based narratives.",
    cols: [
      { name: "title", type: "text" },
      { name: "description", type: "text" },
      { name: "status", type: "text", note: "draft | published | archived" },
      { name: "ai_summary", type: "text" },
    ],
    rls: "Public read; full CRUD restricted to owner.",
  },
  {
    name: "story_scenes",
    purpose: "Individual ordered beats within a story.",
    cols: [
      { name: "story_id", type: "uuid" },
      { name: "scene_number", type: "int" },
      { name: "title", type: "text" },
      { name: "description", type: "text" },
      { name: "artwork_id", type: "uuid (nullable)" },
      { name: "codex_entry_id", type: "uuid (nullable)" },
    ],
    rls: "Public read; insert/update/delete restricted to story owner.",
  },
  {
    name: "profiles",
    purpose: "Public-facing user profile and portfolio toggle.",
    cols: [
      { name: "user_id", type: "uuid" },
      { name: "display_name", type: "text" },
      { name: "bio", type: "text" },
      { name: "portfolio_enabled", type: "boolean" },
    ],
    rls: "Public read; insert/update by self. No delete.",
  },
];

const CHANGELOG = [
  {
    version: "v2.0 — 2026-05-15",
    items: [
      "Added per-user API key system (/api-keys) with SHA-256 hashing and per-day usage metering.",
      "Added public REST API (/archive-public/*) authenticated by x-api-key or JWT, with cursor pagination and best-effort token-bucket rate limiting (120 req/min/key).",
      "Added bulk operations endpoint (/archive-bulk): tag, move, favorite, soft-delete, restore, reanalyze.",
      "Added webhooks (/archive-webhooks) with HMAC-SHA-256 signing and exponential-backoff retries; dispatcher runs every minute via pg_cron.",
      "Added background job runner (/archive-jobs) processing queued work every minute (pg_cron + pg_net).",
      "Added soft-delete (deleted_at) on artworks/codex/stories/collections with /archive-jobs purge_deleted job.",
      "Added revisions tables (artwork_revisions, codex_revisions, story_revisions) for version history.",
      "Added audit_log table for activity feed.",
      "Added pg_trgm + tsvector GIN indexes on titles, descriptions, codex content, story descriptions.",
      "Added /archive-pdf for server-rendered printable catalogs.",
      "Added /openapi (OpenAPI 3.1 spec) for Postman/Insomnia import.",
    ],
  },
  {
    version: "v1.6 — 2026-05-12",
    items: [
      "Added /archive-export (JSON + CSV with collection/user scoping).",
      "Added /archive-search (unified ranked search across artworks, codex, stories, collections).",
      "Added /archive-stats (counts, top-N aggregates, palette frequency, daily timeline).",
      "Added interactive playground, multi-language code samples, and database schema reference.",
    ],
  },
  {
    version: "v1.5 — 2026-05-11",
    items: ["Initial public API documentation page covering analyze-artwork, ask-archive, rss-feed."],
  },
];

const ERROR_CODES = [
  { code: "400", desc: "Invalid request body, missing required fields, or malformed query." },
  { code: "401", desc: "Missing or invalid authentication token (auth-required endpoints only)." },
  { code: "402", desc: "AI credit quota exhausted on Lovable AI Gateway." },
  { code: "403", desc: "Authenticated but missing required scope (e.g. 'read' on the API key)." },
  { code: "404", desc: "Referenced resource (artwork, collection, codex entry) does not exist." },
  { code: "429", desc: "Rate limited — back off and retry with exponential delay." },
  { code: "500", desc: "Internal server error — see edge function logs for the trace." },
];

export default function ApiDocs() {
  const [section, setSection] = useState<"endpoints" | "schema" | "limits" | "errors" | "changelog">("endpoints");

  return (
    <div className="max-w-5xl mx-auto px-8 py-12">
      <div className="mb-10">
        <span className="catalog-num">Reference</span>
        <h1 className="font-serif text-4xl mt-2 text-foreground">API Documentation</h1>
        <p className="font-mono text-xs text-muted-foreground mt-3 tracking-wide leading-relaxed max-w-2xl">
          Atelier exposes backend functions for artwork analysis, conversational AI, search,
          export, statistics, and content feeds. All endpoints are invoked via the Supabase
          Functions SDK or direct HTTPS.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <div className="border border-border p-5 bg-secondary/20">
          <span className="section-label block mb-2">Base URL</span>
          <code className="font-mono text-xs text-foreground break-all">{FN_BASE}</code>
        </div>
        <div className="border border-border p-5 flex items-start gap-3">
          <Lock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" strokeWidth={1.5} />
          <div>
            <span className="section-label block mb-1">Authentication</span>
            <p className="font-mono text-[11px] text-muted-foreground tracking-wide leading-relaxed">
              Endpoints with a lock require <code className="text-foreground">Authorization: Bearer &lt;jwt&gt;</code>.
              The Supabase SDK attaches it automatically for logged-in callers.
            </p>
          </div>
        </div>
      </div>

      <div className="border-b border-border mb-8 flex flex-wrap gap-1">
        {([
          ["endpoints", "Endpoints", FileCode2],
          ["schema", "Schema", Database],
          ["limits", "Limits", Gauge],
          ["errors", "Errors", AlertTriangle],
          ["changelog", "Changelog", GitBranch],
        ] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setSection(key)}
            className={`px-4 py-2 font-mono text-[10px] uppercase tracking-widest flex items-center gap-2 border-b-2 transition-colors ${
              section === key
                ? "border-accent text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-3 w-3" strokeWidth={1.5} />
            {label}
          </button>
        ))}
      </div>

      {section === "endpoints" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <Hash className="h-4 w-4 text-accent" strokeWidth={1.5} />
            <span className="section-label">Endpoints ({ENDPOINTS.length})</span>
          </div>
          {ENDPOINTS.map((ep) => (
            <EndpointCard key={ep.path} endpoint={ep} />
          ))}
        </div>
      )}

      {section === "schema" && (
        <div className="space-y-4">
          <p className="font-mono text-xs text-muted-foreground tracking-wide leading-relaxed max-w-2xl">
            Every table below has Row-Level Security enabled. Reads are public so portfolios
            and shared collections work anonymously; writes are scoped to the authenticated
            owner.
          </p>
          {SCHEMA.map((t) => (
            <div key={t.name} className="border border-border bg-background">
              <div className="px-5 py-3 border-b border-border flex items-center gap-3">
                <code className="font-mono text-sm text-foreground">{t.name}</code>
                <span className="font-mono text-[10px] text-muted-foreground tracking-wide">
                  {t.purpose}
                </span>
              </div>
              <div className="divide-y divide-border">
                {t.cols.map((c) => (
                  <div key={c.name} className="px-5 py-2 flex flex-wrap items-baseline gap-3">
                    <code className="font-mono text-xs text-foreground w-40 shrink-0">{c.name}</code>
                    <Badge variant="outline" className="rounded-none font-mono text-[10px]">
                      {c.type}
                    </Badge>
                    {c.note && (
                      <span className="font-mono text-[11px] text-muted-foreground">{c.note}</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 border-t border-border bg-secondary/20">
                <span className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase mr-2">
                  RLS:
                </span>
                <span className="font-mono text-[11px] text-muted-foreground tracking-wide">
                  {t.rls}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {section === "limits" && (
        <div className="space-y-4 max-w-3xl">
          <div className="border border-border p-5 bg-secondary/20">
            <span className="section-label block mb-2">Rate Limiting</span>
            <p className="font-mono text-xs text-muted-foreground tracking-wide leading-relaxed">
              No hard application-level rate limit is enforced today. Lovable AI Gateway
              applies upstream throttling per workspace; if exceeded the function returns
              HTTP 429. Treat the public REST endpoints as best-effort and back off on 429.
            </p>
          </div>
          {[
            { k: "Edge function payload", v: "6 MB request, 6 MB response" },
            { k: "Edge function timeout", v: "150 s default" },
            { k: "archive-export rows", v: "Up to 1000 artworks per call" },
            { k: "archive-search results", v: "Capped at 100 hits" },
            { k: "archive-stats sample", v: "Up to 2000 artworks per scope" },
            { k: "ask-archive context", v: "100 artworks, 500 tags, 50 codex / 50 stories / 50 collections" },
            { k: "Image storage", v: "Public bucket 'artworks', no per-file size cap enforced" },
          ].map((row) => (
            <div key={row.k} className="border border-border px-5 py-3 flex flex-wrap items-baseline gap-3">
              <code className="font-mono text-xs text-foreground w-56 shrink-0">{row.k}</code>
              <span className="font-mono text-[11px] text-muted-foreground tracking-wide">
                {row.v}
              </span>
            </div>
          ))}
        </div>
      )}

      {section === "errors" && (
        <div className="border border-border max-w-3xl">
          <div className="px-5 py-3 border-b border-border">
            <span className="section-label">HTTP Status Codes</span>
          </div>
          <div className="divide-y divide-border">
            {ERROR_CODES.map((err) => (
              <div key={err.code} className="px-5 py-3 flex items-start gap-4">
                <code className="font-mono text-xs text-accent font-medium w-10 shrink-0">
                  {err.code}
                </code>
                <span className="font-mono text-xs text-muted-foreground tracking-wide">
                  {err.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {section === "changelog" && (
        <div className="space-y-6 max-w-3xl">
          {CHANGELOG.map((c) => (
            <div key={c.version} className="border-l-2 border-accent pl-5">
              <h3 className="font-serif text-lg text-foreground">{c.version}</h3>
              <ul className="mt-2 space-y-1.5">
                {c.items.map((it, i) => (
                  <li
                    key={i}
                    className="font-mono text-xs text-muted-foreground tracking-wide flex items-start gap-2"
                  >
                    <span className="text-accent mt-0.5">—</span>
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <div className="mt-12 pt-6 border-t border-border">
        <span className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
          Atelier — API Reference v1.6
        </span>
      </div>
    </div>
  );
}
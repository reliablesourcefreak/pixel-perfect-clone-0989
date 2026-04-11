import { useState } from "react";
import { FileCode2, Lock, Unlock, ChevronDown, ChevronRight, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

interface Endpoint {
  method: "POST" | "GET";
  path: string;
  title: string;
  description: string;
  auth: "required" | "none";
  requestBody?: { field: string; type: string; required: boolean; description: string }[];
  responseFields?: { field: string; type: string; description: string }[];
  exampleRequest?: string;
  exampleResponse?: string;
  notes?: string[];
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
      { field: "analysis.moods", type: "string[]", description: "Detected mood labels (e.g. 'melancholic', 'ethereal')." },
      { field: "analysis.styles", type: "string[]", description: "Style classifications (e.g. 'impressionism', 'digital art')." },
      { field: "analysis.color_palette", type: "object[]", description: "Extracted colors with hex values and names." },
      { field: "analysis.composition", type: "string", description: "Composition analysis description." },
      { field: "analysis.ai_description", type: "string", description: "AI-generated natural-language description of the artwork." },
      { field: "analysis.technical_details", type: "string", description: "Technical observations about medium, technique, etc." },
    ],
    exampleRequest: JSON.stringify(
      { imageUrl: "https://storage.example.com/art/painting.jpg", artworkId: "550e8400-e29b-41d4-a716-446655440000" },
      null,
      2
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
      2
    ),
    notes: [
      "Automatically updates the artwork's analysis_status to 'completed' on success.",
      "Writes results to the artwork_analysis, artwork_tags, and artwork_categories tables.",
      "Uses Gemini 3 Flash via the Lovable AI Gateway.",
    ],
  },
  {
    method: "POST",
    path: "/ask-archive",
    title: "Ask the Archive",
    description:
      "Streaming conversational AI endpoint. Gathers context from the entire archive (artworks, codex, stories, collections) and responds to natural-language queries about patterns, themes, and connections.",
    auth: "required",
    requestBody: [
      {
        field: "messages",
        type: "{ role: string; content: string }[]",
        required: true,
        description: "Chat history in OpenAI message format. Include all prior turns for context.",
      },
    ],
    responseFields: [
      { field: "Stream", type: "text/event-stream", description: "Server-Sent Events stream of chat completion chunks (OpenAI-compatible format)." },
    ],
    exampleRequest: JSON.stringify(
      {
        messages: [{ role: "user", content: "What moods appear most across my artworks?" }],
      },
      null,
      2
    ),
    exampleResponse: `data: {"choices":[{"delta":{"content":"Based on your archive..."}}]}\n\ndata: [DONE]`,
    notes: [
      "Streams responses via SSE — parse with EventSource or manual chunk reading.",
      "Builds context from up to 100 artworks, 500 tags, 50 codex entries, 50 stories, and 50 collections.",
      "Returns 429 on rate limit and 402 when AI credits are exhausted.",
    ],
  },
  {
    method: "GET",
    path: "/rss-feed",
    title: "RSS Feed",
    description: "Generates an RSS 2.0 XML feed of the latest public artworks in the archive.",
    auth: "none",
    responseFields: [
      { field: "XML", type: "application/rss+xml", description: "Standard RSS 2.0 feed document." },
    ],
    exampleResponse: `<?xml version="1.0"?>\n<rss version="2.0">\n  <channel>\n    <title>Atelier Archive</title>\n    <item>...</item>\n  </channel>\n</rss>`,
    notes: ["Returns the 50 most recent artworks.", "No authentication required — public endpoint."],
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-6 px-2 font-mono text-[10px]"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-border bg-background">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-5 flex items-center gap-4 text-left hover:bg-secondary/30 transition-colors"
      >
        <Badge
          variant="outline"
          className={`font-mono text-[10px] tracking-wider px-2 py-0.5 rounded-none ${
            endpoint.method === "POST"
              ? "border-accent text-accent"
              : "border-primary text-primary"
          }`}
        >
          {endpoint.method}
        </Badge>
        <code className="font-mono text-xs text-foreground">{endpoint.path}</code>
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
              {/* Title & Description */}
              <div>
                <h3 className="font-serif text-lg text-foreground">{endpoint.title}</h3>
                <p className="font-mono text-xs text-muted-foreground mt-2 tracking-wide leading-relaxed">
                  {endpoint.description}
                </p>
              </div>

              {/* Auth badge */}
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">Auth:</span>
                <Badge variant={endpoint.auth === "required" ? "default" : "secondary"} className="rounded-none font-mono text-[10px]">
                  {endpoint.auth === "required" ? "Bearer Token Required" : "Public"}
                </Badge>
              </div>

              {/* Request Body */}
              {endpoint.requestBody && (
                <div>
                  <span className="section-label block mb-3">Request Body</span>
                  <div className="border border-border divide-y divide-border">
                    {endpoint.requestBody.map((f) => (
                      <div key={f.field} className="px-4 py-3 flex items-start gap-4">
                        <code className="font-mono text-xs text-foreground shrink-0">{f.field}</code>
                        <Badge variant="outline" className="rounded-none font-mono text-[10px] shrink-0">{f.type}</Badge>
                        {f.required && <Badge className="rounded-none font-mono text-[10px] bg-accent text-accent-foreground shrink-0">required</Badge>}
                        <span className="font-mono text-xs text-muted-foreground tracking-wide">{f.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Response */}
              {endpoint.responseFields && (
                <div>
                  <span className="section-label block mb-3">Response</span>
                  <div className="border border-border divide-y divide-border">
                    {endpoint.responseFields.map((f) => (
                      <div key={f.field} className="px-4 py-3 flex items-start gap-4">
                        <code className="font-mono text-xs text-foreground shrink-0">{f.field}</code>
                        <Badge variant="outline" className="rounded-none font-mono text-[10px] shrink-0">{f.type}</Badge>
                        <span className="font-mono text-xs text-muted-foreground tracking-wide">{f.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Example Request */}
              {endpoint.exampleRequest && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="section-label">Example Request</span>
                    <CopyButton text={endpoint.exampleRequest} />
                  </div>
                  <pre className="bg-secondary/50 border border-border p-4 overflow-x-auto">
                    <code className="font-mono text-xs text-foreground">{endpoint.exampleRequest}</code>
                  </pre>
                </div>
              )}

              {/* Example Response */}
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

              {/* Notes */}
              {endpoint.notes && (
                <div>
                  <span className="section-label block mb-2">Notes</span>
                  <ul className="space-y-1.5">
                    {endpoint.notes.map((note, i) => (
                      <li key={i} className="font-mono text-xs text-muted-foreground tracking-wide flex items-start gap-2">
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

export default function ApiDocs() {
  return (
    <div className="max-w-4xl mx-auto px-8 py-12">
      <div className="mb-10">
        <span className="catalog-num">Reference</span>
        <h1 className="font-serif text-4xl mt-2 text-foreground">API Documentation</h1>
        <p className="font-mono text-xs text-muted-foreground mt-3 tracking-wide leading-relaxed max-w-2xl">
          Atelier exposes backend functions for artwork analysis, conversational AI, and content feeds.
          All endpoints are invoked via the Supabase Functions SDK or direct HTTPS.
        </p>
      </div>

      {/* Base URL */}
      <div className="border border-border p-5 mb-8 bg-secondary/20">
        <span className="section-label block mb-2">Base URL</span>
        <code className="font-mono text-xs text-foreground">
          {"https://<project-ref>.supabase.co/functions/v1"}
        </code>
        <p className="font-mono text-[10px] text-muted-foreground mt-2 tracking-wide">
          Or invoke via <code className="text-foreground">supabase.functions.invoke("function-name", {"{"} body {"}"})</code>
        </p>
      </div>

      {/* Auth info */}
      <div className="border border-border p-5 mb-8 flex items-start gap-4">
        <Lock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" strokeWidth={1.5} />
        <div>
          <span className="section-label block mb-1">Authentication</span>
          <p className="font-mono text-xs text-muted-foreground tracking-wide leading-relaxed">
            Endpoints marked with <Lock className="h-3 w-3 inline" strokeWidth={1.5} /> require a valid JWT in the
            <code className="text-foreground mx-1">Authorization: Bearer &lt;token&gt;</code> header.
            The Supabase client SDK handles this automatically for logged-in users.
          </p>
        </div>
      </div>

      {/* Endpoints */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <FileCode2 className="h-4 w-4 text-accent" strokeWidth={1.5} />
          <span className="section-label">Endpoints ({ENDPOINTS.length})</span>
        </div>
        {ENDPOINTS.map((ep) => (
          <EndpointCard key={ep.path} endpoint={ep} />
        ))}
      </div>

      {/* Error codes */}
      <div className="mt-12 border border-border p-6">
        <span className="section-label block mb-4">Common Error Codes</span>
        <div className="divide-y divide-border">
          {[
            { code: "400", desc: "Invalid request body or missing required fields." },
            { code: "401", desc: "Missing or invalid authentication token." },
            { code: "402", desc: "AI credit quota exhausted." },
            { code: "429", desc: "Rate limited — too many requests." },
            { code: "500", desc: "Internal server error — check function logs." },
          ].map((err) => (
            <div key={err.code} className="py-3 flex items-start gap-4">
              <code className="font-mono text-xs text-accent font-medium">{err.code}</code>
              <span className="font-mono text-xs text-muted-foreground tracking-wide">{err.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-border">
        <span className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
          Atelier — API Reference v1.5
        </span>
      </div>
    </div>
  );
}

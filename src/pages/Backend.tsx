import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Copy, Trash2, RotateCcw, Plus, RefreshCw } from "lucide-react";
import { archiveConfirm } from "@/components/orbit/ConfirmDialog";

type ApiKey = { id: string; name: string; key_prefix: string; scopes: string[]; is_active: boolean; last_used_at: string | null; expires_at: string | null; created_at: string };
type Webhook = { id: string; url: string; events: string[]; is_active: boolean; created_at: string };
type AuditRow = { id: string; action: string; entity_type: string; entity_id: string | null; metadata: Record<string, unknown>; created_at: string };
type JobRow = { id: string; kind: string; status: string; progress: number; created_at: string; finished_at: string | null; error: string | null };
type TrashRow = { id: string; title: string; kind: "artwork" | "codex" | "story"; deleted_at: string };

const SectionHeader = ({ kicker, title, desc, action }: { kicker: string; title: string; desc?: string; action?: React.ReactNode }) => (
  <div className="flex items-end justify-between mb-6 pb-4 border-b border-border">
    <div>
      <span className="catalog-num">{kicker}</span>
      <h2 className="font-serif text-2xl mt-1 text-foreground">{title}</h2>
      {desc && <p className="font-mono text-[11px] text-muted-foreground mt-2 max-w-xl leading-relaxed">{desc}</p>}
    </div>
    {action}
  </div>
);

const Empty = ({ msg }: { msg: string }) => (
  <div className="border border-border border-dashed p-8 text-center">
    <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">{msg}</p>
  </div>
);

function ApiKeysPanel() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("api-keys", { method: "GET" });
    if (error) toast.error("Failed to load keys");
    setKeys(data?.keys ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!name.trim()) { toast.error("Name required"); return; }
    setCreating(true);
    const { data, error } = await supabase.functions.invoke("api-keys", { method: "POST", body: { name: name.trim(), scopes: ["read"] } });
    setCreating(false);
    if (error || !data?.key) { toast.error("Failed to create"); return; }
    setNewKey(data.key);
    setName("");
    load();
  };

  const revoke = async (id: string, label: string) => {
    if (!(await archiveConfirm({ title: "Revoke key", description: `Revoke "${label}"? Any scripts using it will stop working.`, destructive: true, confirmLabel: "Revoke" }))) return;
    await supabase.functions.invoke(`api-keys?id=${id}`, { method: "DELETE" });
    toast("Key revoked");
    load();
  };

  return (
    <div>
      <SectionHeader
        kicker="01 / Access"
        title="API Keys"
        desc="Issue personal tokens for scripts, shortcuts, or third-party tools that need to read your archive. Each key carries scopes and can be revoked at any time."
      />
      <div className="border border-border p-4 mb-6">
        <div className="flex gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Key name (e.g. 'iOS Shortcut')" className="rounded-none font-mono text-xs" />
          <Button onClick={create} disabled={creating} variant="archive" size="sm" className="font-mono text-[11px]">
            <Plus className="h-3 w-3 mr-1" /> Issue Key
          </Button>
        </div>
        {newKey && (
          <div className="mt-4 border border-accent p-3 bg-accent/5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-2">Save this key — it will not be shown again</p>
            <div className="flex items-center gap-2">
              <code className="font-mono text-[11px] flex-1 break-all bg-background border border-border px-2 py-1.5">{newKey}</code>
              <Button size="sm" variant="outline" className="rounded-none" onClick={() => { navigator.clipboard.writeText(newKey); toast("Copied"); }}>
                <Copy className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="outline" className="rounded-none font-mono text-[10px]" onClick={() => setNewKey(null)}>
                Dismiss
              </Button>
            </div>
          </div>
        )}
      </div>
      {loading ? <Empty msg="Loading…" /> : keys.length === 0 ? <Empty msg="No keys issued" /> : (
        <div className="border border-border divide-y divide-border">
          {keys.map((k) => (
            <div key={k.id} className="p-4 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-xs text-foreground">{k.name}</p>
                <p className="font-mono text-[10px] text-muted-foreground mt-1">
                  <code>{k.key_prefix}…</code> · {k.scopes.join(", ")} · {k.last_used_at ? `used ${new Date(k.last_used_at).toLocaleDateString()}` : "never used"}
                </p>
              </div>
              <Button size="sm" variant="outline" className="rounded-none font-mono text-[10px] text-destructive" onClick={() => revoke(k.id, k.name)}>
                <Trash2 className="h-3 w-3 mr-1" /> Revoke
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WebhooksPanel() {
  const [hooks, setHooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.functions.invoke("archive-webhooks", { method: "GET" });
    setHooks(data?.webhooks ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!/^https?:\/\//.test(url)) { toast.error("Valid URL required"); return; }
    const { data, error } = await supabase.functions.invoke("archive-webhooks", { method: "POST", body: { url, events: ["*"] } });
    if (error || !data?.id) { toast.error("Failed"); return; }
    setSecret(data.secret);
    setUrl("");
    load();
  };

  const remove = async (id: string) => {
    if (!(await archiveConfirm({ title: "Delete webhook?", destructive: true, confirmLabel: "Delete" }))) return;
    await supabase.functions.invoke(`archive-webhooks?id=${id}`, { method: "DELETE" });
    toast("Removed");
    load();
  };

  return (
    <div>
      <SectionHeader
        kicker="02 / Automation"
        title="Webhooks"
        desc="Receive HTTP POSTs when artworks are analyzed, collections published, or anything else changes. Signed with HMAC-SHA256 so you can verify authenticity."
      />
      <div className="border border-border p-4 mb-6">
        <div className="flex gap-2">
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://your-endpoint.example.com/hook" className="rounded-none font-mono text-xs" />
          <Button onClick={create} variant="archive" size="sm" className="font-mono text-[11px]">
            <Plus className="h-3 w-3 mr-1" /> Register
          </Button>
        </div>
        {secret && (
          <div className="mt-4 border border-accent p-3 bg-accent/5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-accent mb-2">Signing secret — store now</p>
            <div className="flex items-center gap-2">
              <code className="font-mono text-[11px] flex-1 break-all bg-background border border-border px-2 py-1.5">{secret}</code>
              <Button size="sm" variant="outline" className="rounded-none" onClick={() => { navigator.clipboard.writeText(secret); toast("Copied"); }}>
                <Copy className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="outline" className="rounded-none font-mono text-[10px]" onClick={() => setSecret(null)}>Dismiss</Button>
            </div>
          </div>
        )}
      </div>
      {loading ? <Empty msg="Loading…" /> : hooks.length === 0 ? <Empty msg="No webhooks registered" /> : (
        <div className="border border-border divide-y divide-border">
          {hooks.map((h) => (
            <div key={h.id} className="p-4 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-xs text-foreground truncate">{h.url}</p>
                <p className="font-mono text-[10px] text-muted-foreground mt-1">events: {h.events.join(", ")} · {h.is_active ? "active" : "paused"}</p>
              </div>
              <Button size="sm" variant="outline" className="rounded-none font-mono text-[10px] text-destructive" onClick={() => remove(h.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ActivityPanel() {
  const { user } = useAuth();
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from("audit_log").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100);
    setRows((data as AuditRow[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [user]);

  return (
    <div>
      <SectionHeader
        kicker="03 / History"
        title="Activity Log"
        desc="A chronological record of changes — keys issued, webhooks registered, bulk operations, jobs run. The last 100 events."
        action={<Button size="sm" variant="outline" className="rounded-none font-mono text-[10px]" onClick={load}><RefreshCw className="h-3 w-3 mr-1" /> Refresh</Button>}
      />
      {loading ? <Empty msg="Loading…" /> : rows.length === 0 ? <Empty msg="No activity recorded yet" /> : (
        <div className="border border-border divide-y divide-border">
          {rows.map((r) => (
            <div key={r.id} className="p-3 grid grid-cols-[120px_1fr_auto] gap-4 items-center">
              <span className="font-mono text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
              <span className="font-mono text-xs text-foreground">{r.action}</span>
              <span className="font-mono text-[10px] text-muted-foreground">{r.entity_type}{r.entity_id ? ` · ${r.entity_id.slice(0, 8)}` : ""}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TrashPanel() {
  const { user } = useAuth();
  const [rows, setRows] = useState<TrashRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [a, c, s] = await Promise.all([
      supabase.from("artworks").select("id, title, deleted_at").eq("user_id", user.id).not("deleted_at", "is", null),
      supabase.from("codex_entries").select("id, title, deleted_at").eq("user_id", user.id).not("deleted_at", "is", null),
      supabase.from("stories").select("id, title, deleted_at").eq("user_id", user.id).not("deleted_at", "is", null),
    ]);
    const merged: TrashRow[] = [
      ...(a.data ?? []).map((r) => ({ ...r, kind: "artwork" as const })),
      ...(c.data ?? []).map((r) => ({ ...r, kind: "codex" as const })),
      ...(s.data ?? []).map((r) => ({ ...r, kind: "story" as const })),
    ].sort((x, y) => y.deleted_at.localeCompare(x.deleted_at));
    setRows(merged);
    setLoading(false);
  };
  useEffect(() => { load(); }, [user]);

  const tableFor = (kind: TrashRow["kind"]) => kind === "artwork" ? "artworks" : kind === "codex" ? "codex_entries" : "stories";

  const restore = async (r: TrashRow) => {
    await supabase.from(tableFor(r.kind)).update({ deleted_at: null }).eq("id", r.id);
    toast("Restored");
    load();
  };

  const purge = async (r: TrashRow) => {
    if (!(await archiveConfirm({ title: "Permanently delete?", description: "This cannot be undone.", destructive: true, confirmLabel: "Delete forever" }))) return;
    await supabase.from(tableFor(r.kind)).delete().eq("id", r.id);
    toast("Purged");
    load();
  };

  return (
    <div>
      <SectionHeader
        kicker="04 / Recovery"
        title="Trash"
        desc="Soft-deleted items. Restore them, or purge permanently. Anything here is hidden from your gallery, codex, and stories."
      />
      {loading ? <Empty msg="Loading…" /> : rows.length === 0 ? <Empty msg="Trash is empty" /> : (
        <div className="border border-border divide-y divide-border">
          {rows.map((r) => (
            <div key={`${r.kind}-${r.id}`} className="p-3 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-xs text-foreground truncate">{r.title || "Untitled"}</p>
                <p className="font-mono text-[10px] text-muted-foreground mt-1">{r.kind} · deleted {new Date(r.deleted_at).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="rounded-none font-mono text-[10px]" onClick={() => restore(r)}>
                  <RotateCcw className="h-3 w-3 mr-1" /> Restore
                </Button>
                <Button size="sm" variant="outline" className="rounded-none font-mono text-[10px] text-destructive" onClick={() => purge(r)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function JobsPanel() {
  const { user } = useAuth();
  const [rows, setRows] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from("background_jobs").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
    setRows((data as JobRow[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [user]);

  const statusColor = (s: string) => s === "completed" ? "text-foreground" : s === "failed" ? "text-destructive" : s === "running" ? "text-accent" : "text-muted-foreground";

  return (
    <div>
      <SectionHeader
        kicker="05 / Queue"
        title="Background Jobs"
        desc="Long-running tasks run asynchronously here — batch re-analysis, large exports, anything that would time out a request. Polled every minute."
        action={<Button size="sm" variant="outline" className="rounded-none font-mono text-[10px]" onClick={load}><RefreshCw className="h-3 w-3 mr-1" /> Refresh</Button>}
      />
      {loading ? <Empty msg="Loading…" /> : rows.length === 0 ? <Empty msg="No jobs queued" /> : (
        <div className="border border-border divide-y divide-border">
          {rows.map((j) => (
            <div key={j.id} className="p-3 grid grid-cols-[160px_1fr_120px_auto] gap-4 items-center">
              <span className="font-mono text-[10px] text-muted-foreground">{new Date(j.created_at).toLocaleString()}</span>
              <span className="font-mono text-xs text-foreground">{j.kind}</span>
              <span className={`font-mono text-[10px] uppercase tracking-widest ${statusColor(j.status)}`}>{j.status}{j.status === "running" ? ` ${j.progress}%` : ""}</span>
              <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[200px]">{j.error || (j.finished_at ? `done ${new Date(j.finished_at).toLocaleTimeString()}` : "")}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Backend() {
  return (
    <div className="px-8 py-10 max-w-5xl mx-auto">
      <div className="mb-8">
        <span className="catalog-num">Infrastructure</span>
        <h1 className="font-serif text-3xl mt-2 text-foreground">Backend</h1>
        <p className="font-mono text-[11px] text-muted-foreground mt-3 max-w-2xl leading-relaxed">
          Operational surface for the archive. Issue keys, register webhooks, audit changes, recover deletions, and watch background jobs run.
        </p>
      </div>
      <div className="border-t border-accent border-2 mb-8" />
      <Tabs defaultValue="keys" className="w-full">
        <TabsList className="rounded-none bg-transparent border border-border p-0 h-auto w-full grid grid-cols-5">
          {[
            { v: "keys", l: "API Keys" },
            { v: "webhooks", l: "Webhooks" },
            { v: "activity", l: "Activity" },
            { v: "trash", l: "Trash" },
            { v: "jobs", l: "Jobs" },
          ].map((t) => (
            <TabsTrigger
              key={t.v}
              value={t.v}
              className="rounded-none font-mono text-[10px] uppercase tracking-widest data-[state=active]:bg-foreground data-[state=active]:text-background border-r border-border last:border-r-0 py-3"
            >
              {t.l}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="mt-8">
          <TabsContent value="keys"><ApiKeysPanel /></TabsContent>
          <TabsContent value="webhooks"><WebhooksPanel /></TabsContent>
          <TabsContent value="activity"><ActivityPanel /></TabsContent>
          <TabsContent value="trash"><TrashPanel /></TabsContent>
          <TabsContent value="jobs"><JobsPanel /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
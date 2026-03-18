import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Upload, X, Loader2, CheckCircle } from "lucide-react";

interface QueuedFile {
  file: File;
  preview: string;
  title: string;
  status: "pending" | "uploading" | "analyzing" | "done" | "error";
  artworkId?: string;
  error?: string;
}

export default function UploadArtwork() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [processing, setProcessing] = useState(false);

  const addFiles = useCallback((files: FileList | File[]) => {
    const newItems: QueuedFile[] = [];
    Array.from(files).forEach((f) => {
      if (!f.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        setQueue((prev) => [
          ...prev,
          { file: f, preview: ev.target?.result as string, title: "", status: "pending" },
        ]);
      };
      reader.readAsDataURL(f);
    });
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
  }, [addFiles]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const removeFile = (index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
  };

  const updateTitle = (index: number, title: string) => {
    setQueue((prev) => prev.map((item, i) => (i === index ? { ...item, title } : item)));
  };

  const updateStatus = (index: number, status: QueuedFile["status"], extra?: Partial<QueuedFile>) => {
    setQueue((prev) => prev.map((item, i) => (i === index ? { ...item, status, ...extra } : item)));
  };

  const handleUploadAll = async () => {
    if (!user || queue.length === 0) return;
    setProcessing(true);

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      if (item.status === "done") continue;

      try {
        updateStatus(i, "uploading");
        const ext = item.file.name.split(".").pop();
        const path = `${user.id}/${Date.now()}-${i}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("artworks").upload(path, item.file);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("artworks").getPublicUrl(path);

        const { data: artwork, error: insertError } = await supabase
          .from("artworks")
          .insert({
            user_id: user.id,
            title: item.title || "Untitled",
            image_url: urlData.publicUrl,
            file_size_bytes: item.file.size,
            analysis_status: "pending",
          })
          .select()
          .single();

        if (insertError) throw insertError;

        updateStatus(i, "analyzing", { artworkId: artwork.id });

        // Fire and forget analysis — don't block next upload
        supabase.functions.invoke("analyze-artwork", {
          body: { artwork_id: artwork.id, image_url: urlData.publicUrl },
        }).then(({ error: fnError }) => {
          if (fnError) {
            console.error("Analysis error:", fnError);
            updateStatus(i, "done");
          } else {
            updateStatus(i, "done");
          }
        });

        updateStatus(i, "done", { artworkId: artwork.id });
      } catch (err: any) {
        updateStatus(i, "error", { error: err.message });
      }
    }

    setProcessing(false);
    const doneCount = queue.filter((_, i) => queue[i].status !== "error").length;
    toast({
      title: "Upload complete",
      description: `${doneCount} artwork${doneCount !== 1 ? "s" : ""} uploaded and queued for analysis.`,
    });
  };

  const pendingCount = queue.filter((q) => q.status === "pending").length;
  const doneCount = queue.filter((q) => q.status === "done").length;

  return (
    <div className="px-8 py-10 max-w-4xl mx-auto">
      <div className="mb-10">
        <span className="catalog-num">New Submission</span>
        <h1 className="font-serif text-3xl mt-2 text-foreground">Upload Artwork</h1>
        <p className="font-mono text-xs text-muted-foreground mt-2 tracking-wide max-w-lg">
          Drop one or multiple images. Each will be uploaded and analyzed by AI automatically.
        </p>
      </div>

      <div className="border-t border-border mb-8" />

      {/* Drop zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="border-2 border-dashed border-border hover:border-foreground transition-colors cursor-pointer mb-8"
      >
        <label className="flex flex-col items-center justify-center py-16 cursor-pointer">
          <Upload className="h-6 w-6 text-muted-foreground mb-3" strokeWidth={1} />
          <span className="font-mono text-xs text-muted-foreground tracking-wide">
            Drop images here or click to browse
          </span>
          <span className="font-mono text-[10px] text-muted-foreground/60 mt-1 tracking-wide">
            JPG, PNG, WEBP — Multiple files supported — Max 20MB each
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>

      {/* Queue */}
      {queue.length > 0 && (
        <div className="space-y-0 border border-border divide-y divide-border mb-8">
          {queue.map((item, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <img src={item.preview} alt="" className="h-16 w-16 object-cover border border-border shrink-0" />
              <div className="flex-1 min-w-0">
                <Input
                  value={item.title}
                  onChange={(e) => updateTitle(i, e.target.value)}
                  placeholder="Title (optional — AI will suggest)"
                  className="rounded-none h-8 text-xs font-mono"
                  disabled={item.status !== "pending"}
                />
                <p className="font-mono text-[10px] text-muted-foreground mt-1 tracking-wide">
                  {item.file.name} · {(item.file.size / 1024).toFixed(0)} KB
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                {item.status === "pending" && (
                  <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-foreground transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                )}
                {item.status === "uploading" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                {item.status === "analyzing" && <Loader2 className="h-4 w-4 animate-spin text-accent" />}
                {item.status === "done" && <CheckCircle className="h-4 w-4 text-accent" />}
                {item.status === "error" && (
                  <span className="font-mono text-[10px] text-destructive">{item.error}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {queue.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="font-mono text-xs text-muted-foreground tracking-wide">
            {queue.length} file{queue.length !== 1 ? "s" : ""} queued · {doneCount} done
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              className="font-mono text-xs"
              onClick={() => setQueue([])}
              disabled={processing}
            >
              Clear All
            </Button>
            <Button
              variant="archive"
              disabled={pendingCount === 0 || processing}
              onClick={handleUploadAll}
            >
              {processing ? (
                <><Loader2 className="h-3 w-3 mr-2 animate-spin" />Processing…</>
              ) : (
                <>Upload {pendingCount} File{pendingCount !== 1 ? "s" : ""}</>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* After upload, link to gallery */}
      {doneCount > 0 && !processing && (
        <div className="mt-6 border border-border p-4 text-center">
          <Button variant="archive" size="sm" onClick={() => navigate("/gallery")}>
            View in Gallery →
          </Button>
        </div>
      )}
    </div>
  );
}

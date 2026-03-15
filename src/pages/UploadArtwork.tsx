import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Upload, X, Loader2 } from "lucide-react";

export default function UploadArtwork() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f || !f.type.startsWith("image/")) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  }, []);

  const handleUpload = async () => {
    if (!file || !user) return;
    setUploading(true);

    try {
      // 1. Upload image to storage
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("artworks").upload(path, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("artworks").getPublicUrl(path);
      const imageUrl = urlData.publicUrl;

      // 2. Create artwork record
      const { data: artwork, error: insertError } = await supabase
        .from("artworks")
        .insert({
          user_id: user.id,
          title: title || "Untitled",
          image_url: imageUrl,
          file_size_bytes: file.size,
          analysis_status: "pending",
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setUploading(false);
      setAnalyzing(true);

      // 3. Trigger AI analysis
      const { error: fnError } = await supabase.functions.invoke("analyze-artwork", {
        body: { artwork_id: artwork.id, image_url: imageUrl },
      });

      if (fnError) {
        console.error("Analysis error:", fnError);
        toast({ title: "Upload succeeded", description: "AI analysis failed — you can retry later." });
      } else {
        toast({ title: "Analysis complete", description: "Your artwork has been catalogued." });
      }

      navigate(`/gallery/${artwork.id}`);
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const isProcessing = uploading || analyzing;

  return (
    <div className="px-8 py-10 max-w-3xl mx-auto">
      <div className="mb-10">
        <span className="catalog-num">New Submission</span>
        <h1 className="font-serif text-3xl mt-2 text-foreground">Upload Artwork</h1>
        <p className="font-mono text-xs text-muted-foreground mt-2 tracking-wide max-w-lg">
          Upload an AI-generated artwork. The system will automatically analyze visual style,
          assign categories, generate descriptors, and map relationships.
        </p>
      </div>

      <div className="border-t border-border mb-8" />

      <div className="space-y-8">
        {/* Drop zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-border hover:border-foreground transition-colors cursor-pointer relative"
        >
          {preview ? (
            <div className="relative">
              <img src={preview} alt="Preview" className="w-full max-h-[500px] object-contain" />
              <button
                onClick={() => { setFile(null); setPreview(null); }}
                className="absolute top-3 right-3 h-8 w-8 flex items-center justify-center bg-background border border-border hover:bg-secondary transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center py-20 cursor-pointer">
              <Upload className="h-6 w-6 text-muted-foreground mb-3" strokeWidth={1} />
              <span className="font-mono text-xs text-muted-foreground tracking-wide">
                Drop image here or click to browse
              </span>
              <span className="font-mono text-[10px] text-muted-foreground/60 mt-1 tracking-wide">
                JPG, PNG, WEBP — Max 20MB
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Title */}
        <div>
          <Label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Title (optional — AI will suggest one)
          </Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Leave blank for AI-generated title"
            className="mt-1.5 rounded-none"
          />
        </div>

        {/* Submit */}
        <Button
          variant="archive"
          className="w-full"
          disabled={!file || isProcessing}
          onClick={handleUpload}
        >
          {uploading && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
          {analyzing && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
          {uploading ? "Uploading…" : analyzing ? "Analyzing with AI…" : "Upload & Analyze"}
        </Button>

        {analyzing && (
          <div className="border border-border p-5 text-center">
            <p className="font-mono text-xs text-muted-foreground tracking-wide animate-pulse">
              AI is analyzing visual style, categories, composition, and color palette…
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

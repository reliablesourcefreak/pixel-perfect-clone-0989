-- Artworks table
CREATE TABLE public.artworks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  file_size_bytes BIGINT,
  width INT,
  height INT,
  analysis_status TEXT NOT NULL DEFAULT 'pending' CHECK (analysis_status IN ('pending', 'analyzing', 'complete', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- AI Analysis results
CREATE TABLE public.artwork_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artwork_id UUID NOT NULL UNIQUE REFERENCES public.artworks(id) ON DELETE CASCADE,
  ai_description TEXT,
  composition TEXT,
  technical_details TEXT,
  color_palette JSONB DEFAULT '[]'::jsonb,
  styles TEXT[] DEFAULT '{}',
  moods TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Categories with confidence scores
CREATE TABLE public.artwork_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artwork_id UUID NOT NULL REFERENCES public.artworks(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  confidence NUMERIC(5,2) NOT NULL DEFAULT 0,
  UNIQUE(artwork_id, category)
);

-- Tags
CREATE TABLE public.artwork_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artwork_id UUID NOT NULL REFERENCES public.artworks(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  UNIQUE(artwork_id, tag)
);

-- Enable RLS
ALTER TABLE public.artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artwork_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artwork_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artwork_tags ENABLE ROW LEVEL SECURITY;

-- Artworks: public read, owner write
CREATE POLICY "Anyone can view artworks" ON public.artworks FOR SELECT USING (true);
CREATE POLICY "Users can insert own artworks" ON public.artworks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own artworks" ON public.artworks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own artworks" ON public.artworks FOR DELETE USING (auth.uid() = user_id);

-- Analysis: public read, system/owner write
CREATE POLICY "Anyone can view analysis" ON public.artwork_analysis FOR SELECT USING (true);
CREATE POLICY "Users can insert analysis for own artworks" ON public.artwork_analysis FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.artworks WHERE id = artwork_id AND user_id = auth.uid()));
CREATE POLICY "Users can update analysis for own artworks" ON public.artwork_analysis FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.artworks WHERE id = artwork_id AND user_id = auth.uid()));

-- Categories: public read, owner write
CREATE POLICY "Anyone can view categories" ON public.artwork_categories FOR SELECT USING (true);
CREATE POLICY "Users can insert categories for own artworks" ON public.artwork_categories FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.artworks WHERE id = artwork_id AND user_id = auth.uid()));

-- Tags: public read, owner write
CREATE POLICY "Anyone can view tags" ON public.artwork_tags FOR SELECT USING (true);
CREATE POLICY "Users can insert tags for own artworks" ON public.artwork_tags FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.artworks WHERE id = artwork_id AND user_id = auth.uid()));

-- Storage bucket for artwork images
INSERT INTO storage.buckets (id, name, public) VALUES ('artworks', 'artworks', true);

CREATE POLICY "Anyone can view artwork images" ON storage.objects FOR SELECT USING (bucket_id = 'artworks');
CREATE POLICY "Auth users can upload artwork images" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'artworks' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete own artwork images" ON storage.objects FOR DELETE
  USING (bucket_id = 'artworks' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_artworks_updated_at
  BEFORE UPDATE ON public.artworks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
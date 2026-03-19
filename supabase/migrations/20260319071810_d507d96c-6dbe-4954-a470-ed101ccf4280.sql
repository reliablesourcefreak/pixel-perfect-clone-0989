
-- Collections table (DB-backed, replaces localStorage)
CREATE TABLE public.collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '#6B4AFF',
  cover_image_url TEXT,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Junction table: artworks in collections
CREATE TABLE public.collection_artworks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  artwork_id UUID NOT NULL REFERENCES public.artworks(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(collection_id, artwork_id)
);

-- Enable RLS
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_artworks ENABLE ROW LEVEL SECURITY;

-- Collections RLS
CREATE POLICY "Anyone can view collections" ON public.collections FOR SELECT USING (true);
CREATE POLICY "Users can insert own collections" ON public.collections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own collections" ON public.collections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own collections" ON public.collections FOR DELETE USING (auth.uid() = user_id);

-- Collection artworks RLS
CREATE POLICY "Anyone can view collection artworks" ON public.collection_artworks FOR SELECT USING (true);
CREATE POLICY "Users can add to own collections" ON public.collection_artworks FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.collections WHERE id = collection_artworks.collection_id AND user_id = auth.uid())
);
CREATE POLICY "Users can remove from own collections" ON public.collection_artworks FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.collections WHERE id = collection_artworks.collection_id AND user_id = auth.uid())
);

-- Trigger for updated_at
CREATE TRIGGER update_collections_updated_at
  BEFORE UPDATE ON public.collections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

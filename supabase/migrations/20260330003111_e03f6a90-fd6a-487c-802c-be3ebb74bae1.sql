
-- Codex entries table
CREATE TABLE public.codex_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'other',
  content TEXT NOT NULL DEFAULT '',
  ai_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Stories table
CREATE TABLE public.stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  ai_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Story scenes table
CREATE TABLE public.story_scenes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  scene_number INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  artwork_id UUID REFERENCES public.artworks(id) ON DELETE SET NULL,
  codex_entry_id UUID REFERENCES public.codex_entries(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Codex-artwork links
CREATE TABLE public.codex_artwork_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codex_entry_id UUID NOT NULL REFERENCES public.codex_entries(id) ON DELETE CASCADE,
  artwork_id UUID NOT NULL REFERENCES public.artworks(id) ON DELETE CASCADE,
  UNIQUE(codex_entry_id, artwork_id)
);

-- Enable RLS
ALTER TABLE public.codex_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.codex_artwork_links ENABLE ROW LEVEL SECURITY;

-- Codex RLS
CREATE POLICY "Anyone can view codex entries" ON public.codex_entries FOR SELECT USING (true);
CREATE POLICY "Users can insert own codex entries" ON public.codex_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own codex entries" ON public.codex_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own codex entries" ON public.codex_entries FOR DELETE USING (auth.uid() = user_id);

-- Stories RLS
CREATE POLICY "Anyone can view stories" ON public.stories FOR SELECT USING (true);
CREATE POLICY "Users can insert own stories" ON public.stories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own stories" ON public.stories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own stories" ON public.stories FOR DELETE USING (auth.uid() = user_id);

-- Story scenes RLS
CREATE POLICY "Anyone can view story scenes" ON public.story_scenes FOR SELECT USING (true);
CREATE POLICY "Users can insert scenes for own stories" ON public.story_scenes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.stories WHERE id = story_scenes.story_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update scenes for own stories" ON public.story_scenes FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.stories WHERE id = story_scenes.story_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete scenes for own stories" ON public.story_scenes FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.stories WHERE id = story_scenes.story_id AND user_id = auth.uid())
);

-- Codex artwork links RLS
CREATE POLICY "Anyone can view codex artwork links" ON public.codex_artwork_links FOR SELECT USING (true);
CREATE POLICY "Users can insert codex artwork links" ON public.codex_artwork_links FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.codex_entries WHERE id = codex_artwork_links.codex_entry_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete codex artwork links" ON public.codex_artwork_links FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.codex_entries WHERE id = codex_artwork_links.codex_entry_id AND user_id = auth.uid())
);

-- Updated_at triggers
CREATE TRIGGER update_codex_entries_updated_at BEFORE UPDATE ON public.codex_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_stories_updated_at BEFORE UPDATE ON public.stories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

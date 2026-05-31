
DROP POLICY IF EXISTS "Anyone can view artworks" ON public.artworks;
CREATE POLICY "Owners can view own artworks" ON public.artworks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Public can view artworks in public collections" ON public.artworks FOR SELECT USING (
  deleted_at IS NULL AND EXISTS (
    SELECT 1 FROM public.collection_artworks ca
    JOIN public.collections c ON c.id = ca.collection_id
    WHERE ca.artwork_id = artworks.id AND c.is_public = true AND c.deleted_at IS NULL
  )
);

DROP POLICY IF EXISTS "Anyone can view codex entries" ON public.codex_entries;
CREATE POLICY "Owners can view own codex entries" ON public.codex_entries FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view codex artwork links" ON public.codex_artwork_links;
CREATE POLICY "Owners can view own codex artwork links" ON public.codex_artwork_links FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.codex_entries ce WHERE ce.id = codex_artwork_links.codex_entry_id AND ce.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Anyone can view collections" ON public.collections;
CREATE POLICY "Owners can view own collections" ON public.collections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Public can view public collections" ON public.collections FOR SELECT USING (is_public = true AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Anyone can view collection artworks" ON public.collection_artworks;
CREATE POLICY "Owners can view own collection artworks" ON public.collection_artworks FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_artworks.collection_id AND c.user_id = auth.uid())
);
CREATE POLICY "Public can view artworks of public collections" ON public.collection_artworks FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_artworks.collection_id AND c.is_public = true AND c.deleted_at IS NULL)
);

DROP POLICY IF EXISTS "Anyone can view stories" ON public.stories;
CREATE POLICY "Owners can view own stories" ON public.stories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Public can view published stories" ON public.stories FOR SELECT USING (status = 'published' AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Anyone can view story scenes" ON public.story_scenes;
CREATE POLICY "Owners can view own story scenes" ON public.story_scenes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.stories s WHERE s.id = story_scenes.story_id AND s.user_id = auth.uid())
);
CREATE POLICY "Public can view scenes of published stories" ON public.story_scenes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.stories s WHERE s.id = story_scenes.story_id AND s.status = 'published' AND s.deleted_at IS NULL)
);

DROP POLICY IF EXISTS "Auth users can upload artwork images" ON storage.objects;
CREATE POLICY "Users can upload to own folder" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'artworks' AND auth.uid() IS NOT NULL AND (auth.uid())::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can update own artwork images" ON storage.objects FOR UPDATE
USING (bucket_id = 'artworks' AND (auth.uid())::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'artworks' AND (auth.uid())::text = (storage.foldername(name))[1]);

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_api_key_usage(uuid, date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_api_key_usage(uuid, date) TO service_role;

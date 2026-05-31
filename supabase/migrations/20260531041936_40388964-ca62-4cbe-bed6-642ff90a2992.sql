
DROP POLICY IF EXISTS "Anyone can view analysis" ON public.artwork_analysis;
CREATE POLICY "Owners can view own artwork analysis" ON public.artwork_analysis FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.artworks a WHERE a.id = artwork_analysis.artwork_id AND a.user_id = auth.uid())
);
CREATE POLICY "Public can view analysis of public-collection artworks" ON public.artwork_analysis FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.artworks a
    JOIN public.collection_artworks ca ON ca.artwork_id = a.id
    JOIN public.collections c ON c.id = ca.collection_id
    WHERE a.id = artwork_analysis.artwork_id
      AND a.deleted_at IS NULL
      AND c.is_public = true
      AND c.deleted_at IS NULL
  )
);

DROP POLICY IF EXISTS "Anyone can view categories" ON public.artwork_categories;
CREATE POLICY "Owners can view own artwork categories" ON public.artwork_categories FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.artworks a WHERE a.id = artwork_categories.artwork_id AND a.user_id = auth.uid())
);
CREATE POLICY "Public can view categories of public-collection artworks" ON public.artwork_categories FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.artworks a
    JOIN public.collection_artworks ca ON ca.artwork_id = a.id
    JOIN public.collections c ON c.id = ca.collection_id
    WHERE a.id = artwork_categories.artwork_id
      AND a.deleted_at IS NULL
      AND c.is_public = true
      AND c.deleted_at IS NULL
  )
);

DROP POLICY IF EXISTS "Anyone can view tags" ON public.artwork_tags;
CREATE POLICY "Owners can view own artwork tags" ON public.artwork_tags FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.artworks a WHERE a.id = artwork_tags.artwork_id AND a.user_id = auth.uid())
);
CREATE POLICY "Public can view tags of public-collection artworks" ON public.artwork_tags FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.artworks a
    JOIN public.collection_artworks ca ON ca.artwork_id = a.id
    JOIN public.collections c ON c.id = ca.collection_id
    WHERE a.id = artwork_tags.artwork_id
      AND a.deleted_at IS NULL
      AND c.is_public = true
      AND c.deleted_at IS NULL
  )
);

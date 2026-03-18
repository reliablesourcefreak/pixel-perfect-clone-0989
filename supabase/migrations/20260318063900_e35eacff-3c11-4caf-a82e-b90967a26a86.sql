
CREATE POLICY "Users can delete tags for own artworks"
ON public.artwork_tags
FOR DELETE
TO public
USING (EXISTS (
  SELECT 1 FROM artworks WHERE artworks.id = artwork_tags.artwork_id AND artworks.user_id = auth.uid()
));

CREATE POLICY "Users can delete categories for own artworks"
ON public.artwork_categories
FOR DELETE
TO public
USING (EXISTS (
  SELECT 1 FROM artworks WHERE artworks.id = artwork_categories.artwork_id AND artworks.user_id = auth.uid()
));

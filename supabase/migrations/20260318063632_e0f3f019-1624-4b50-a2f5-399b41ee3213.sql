
ALTER TABLE public.artworks ADD COLUMN IF NOT EXISTS is_favorited boolean NOT NULL DEFAULT false;

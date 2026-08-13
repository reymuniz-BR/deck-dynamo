ALTER TABLE public.decks ADD COLUMN IF NOT EXISTS brand jsonb;
ALTER TABLE public.deck_sources ADD COLUMN IF NOT EXISTS brand jsonb;
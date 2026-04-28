-- Update posts table to support different types and metadata
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS type text DEFAULT 'regular';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Ensure it's in the realtime publication
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        -- Publication already includes 'posts', we just added columns so it should pick them up automatically.
        -- But for safety if user is recreating tables:
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND schemaname = 'public' 
            AND tablename = 'posts'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
        END IF;
    END IF;
END $$;

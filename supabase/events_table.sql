-- CREATE EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone,
  location text,
  link text,
  creator_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn on Row Level Security for events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Events Policies
DROP POLICY IF EXISTS "Events are viewable by everyone." ON public.events;
CREATE POLICY "Events are viewable by everyone." ON public.events
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create events." ON public.events;
CREATE POLICY "Authenticated users can create events." ON public.events
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Creators can update their own events." ON public.events;
CREATE POLICY "Creators can update their own events." ON public.events
  FOR UPDATE USING ((select auth.uid()) = creator_id);

DROP POLICY IF EXISTS "Creators can delete their own events." ON public.events;
CREATE POLICY "Creators can delete their own events." ON public.events
  FOR DELETE USING ((select auth.uid()) = creator_id);

-- Add the events table to Supabase's realtime publication
-- Note: This may fail if the table is already in the publication or if the publication doesn't exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
  END IF;
EXCEPTION
  WHEN others THEN
    NULL;
END $$;

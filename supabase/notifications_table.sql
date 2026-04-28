-- CREATE NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL, -- 'reputation', 'message', 'event', etc.
  title text NOT NULL,
  content text,
  link text,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn on Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Notifications Policies
DROP POLICY IF EXISTS "Users can view their own notifications." ON public.notifications;
CREATE POLICY "Users can view their own notifications." ON public.notifications
  FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "System can create notifications." ON public.notifications;
CREATE POLICY "System can create notifications." ON public.notifications
  FOR INSERT WITH CHECK (true); -- Ideally this would be more restrictive, but for now we'll allow it.

-- Add to Realtime
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND schemaname = 'public' 
            AND tablename = 'notifications'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
        END IF;
    END IF;
END $$;

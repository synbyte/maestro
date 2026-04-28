-- CREATE USER PROJECTS TABLE
CREATE TABLE IF NOT EXISTS public.user_projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  url text,
  image_url text,
  completed_at date,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn on Row Level Security
ALTER TABLE public.user_projects ENABLE ROW LEVEL SECURITY;

-- Projects Policies
DROP POLICY IF EXISTS "Projects are viewable by everyone." ON public.user_projects;
CREATE POLICY "Projects are viewable by everyone." ON public.user_projects
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage their own projects." ON public.user_projects;
CREATE POLICY "Users can manage their own projects." ON public.user_projects
  FOR ALL USING ((select auth.uid()) = user_id);

-- Add to Realtime
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND schemaname = 'public' 
            AND tablename = 'user_projects'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.user_projects;
        END IF;
    END IF;
END $$;

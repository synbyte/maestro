-- Run this script in the Supabase SQL Editor to add the missing fields for User Profiles

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS banner_url text,
  ADD COLUMN IF NOT EXISTS headline text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS github_url text,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS tech_stack text,
  ADD COLUMN IF NOT EXISTS current_projects text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS start_date text,
  ADD COLUMN IF NOT EXISTS is_onboarded boolean default false,
  ADD COLUMN IF NOT EXISTS current_streak integer default 0,
  ADD COLUMN IF NOT EXISTS last_login_date date,
  ADD COLUMN IF NOT EXISTS reputation integer default 0;

-- CREATE FUNCTION FOR ATOMIC REPUTATION INCREMENTS
CREATE OR REPLACE FUNCTION public.increment_reputation(profile_id uuid, amount int)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET reputation = reputation + amount
  WHERE id = profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CREATE USER COURSES TABLE
CREATE TABLE IF NOT EXISTS public.user_courses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  course_name text not null,
  week_number integer default 1,
  lesson_number integer default 1,
  is_completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add week/lesson columns if upgrading from old schema
ALTER TABLE public.user_courses ADD COLUMN IF NOT EXISTS week_number integer default 1;
ALTER TABLE public.user_courses ADD COLUMN IF NOT EXISTS lesson_number integer default 1;

-- Turn on Row Level Security for user_courses
ALTER TABLE public.user_courses ENABLE ROW LEVEL SECURITY;

-- User Courses Policies
DROP POLICY IF EXISTS "Courses are viewable by everyone." ON public.user_courses;
CREATE POLICY "Courses are viewable by everyone." ON public.user_courses
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage their own courses." ON public.user_courses;
CREATE POLICY "Users can manage their own courses." ON public.user_courses
  FOR ALL USING ((select auth.uid()) = user_id);
-- CREATE FOLLOWS TABLE
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id uuid references public.profiles(id) on delete cascade not null,
  following_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  PRIMARY KEY (follower_id, following_id)
);

-- Turn on Row Level Security for follows
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Follows Policies
DROP POLICY IF EXISTS "Follows are viewable by everyone." ON public.follows;
CREATE POLICY "Follows are viewable by everyone." ON public.follows
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can follow others." ON public.follows;
CREATE POLICY "Users can follow others." ON public.follows
  FOR INSERT WITH CHECK ((select auth.uid()) = follower_id);

DROP POLICY IF EXISTS "Users can unfollow others." ON public.follows;
CREATE POLICY "Users can unfollow others." ON public.follows
  FOR DELETE USING ((select auth.uid()) = follower_id);

-- CREATE MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  recipient_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Realtime for messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Add the messages table to Supabase's realtime publication (no dashboard needed)
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Messages Policies
DROP POLICY IF EXISTS "Users can view their own messages." ON public.messages;
CREATE POLICY "Users can view their own messages." ON public.messages
  FOR SELECT USING (
    (select auth.uid()) = sender_id OR (select auth.uid()) = recipient_id
  );

DROP POLICY IF EXISTS "Users can send messages." ON public.messages;
CREATE POLICY "Users can send messages." ON public.messages
  FOR INSERT WITH CHECK ((select auth.uid()) = sender_id);

DROP POLICY IF EXISTS "Recipients can mark messages as read." ON public.messages;
CREATE POLICY "Recipients can mark messages as read." ON public.messages
  FOR UPDATE USING ((select auth.uid()) = recipient_id);

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
  ADD COLUMN IF NOT EXISTS is_onboarded boolean default false;

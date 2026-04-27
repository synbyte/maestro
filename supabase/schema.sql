-- CREATE PROFILES TABLE
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  display_name text,
  cohort text default 'Cohort 8',
  role text default 'Student',
  avatar_url text,
  banner_url text,
  headline text,
  location text,
  website_url text,
  github_url text,
  linkedin_url text,
  tech_stack text,
  current_projects text,
  bio text,
  start_date text,
  is_onboarded boolean default false,
  current_streak integer default 0,
  last_login_date date,
  reputation integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- CREATE FUNCTION FOR ATOMIC REPUTATION INCREMENTS
create or replace function public.increment_reputation(profile_id uuid, amount int)
returns void as $$
begin
  update public.profiles
  set reputation = reputation + amount
  where id = profile_id;
end;
$$ language plpgsql security definer;

-- Turn on Row Level Security for profiles
alter table public.profiles enable row level security;

-- Profiles Policies
create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);
create policy "Users can insert their own profile." on profiles
  for insert with check ((select auth.uid()) = id);
create policy "Users can update own profile." on profiles
  for update using ((select auth.uid()) = id);

-- CREATE USER COURSES TABLE
create table public.user_courses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  course_name text not null,
  current_lesson text,
  is_completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on Row Level Security for user_courses
alter table public.user_courses enable row level security;

-- User Courses Policies
drop policy if exists "Courses are viewable by everyone." on user_courses;
create policy "Courses are viewable by everyone." on user_courses
  for select using (true);

drop policy if exists "Users can manage their own courses." on user_courses
  for all using ((select auth.uid()) = user_id);
create policy "Users can manage their own courses." on user_courses
  for all using ((select auth.uid()) = user_id);

-- CREATE FOLLOWS TABLE
create table if not exists public.follows (
  follower_id uuid references public.profiles(id) on delete cascade not null,
  following_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (follower_id, following_id)
);

-- Turn on Row Level Security for follows
alter table public.follows enable row level security;

-- Follows Policies
drop policy if exists "Follows are viewable by everyone." on public.follows;
create policy "Follows are viewable by everyone." on public.follows
  for select using (true);

drop policy if exists "Users can follow others." on public.follows;
create policy "Users can follow others." on public.follows
  for insert with check ((select auth.uid()) = follower_id);

drop policy if exists "Users can unfollow others." on public.follows;
create policy "Users can unfollow others." on public.follows
  for delete using ((select auth.uid()) = follower_id);

-- Function and trigger to automatically create profile for new auth.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- CREATE POSTS TABLE (The Quad)
create table public.posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  likes_count integer default 0,
  comments_count integer default 0
);

-- Turn on Row Level Security for posts
alter table public.posts enable row level security;

-- Posts Policies
create policy "Posts are viewable by everyone." on posts
  for select using (true);
create policy "Authenticated users can create posts." on posts
  for insert with check (auth.role() = 'authenticated');
create policy "Users can update their own posts." on posts
  for update using ((select auth.uid()) = user_id);
create policy "Users can delete their own posts." on posts
  for delete using ((select auth.uid()) = user_id);


-- CREATE COMMENTS TABLE
create table public.comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on Row Level Security for comments
alter table public.comments enable row level security;

-- Comments Policies
create policy "Comments are viewable by everyone." on comments
  for select using (true);
create policy "Authenticated users can create comments." on comments
  for insert with check (auth.role() = 'authenticated');
create policy "Users can delete their own comments." on comments
  for delete using ((select auth.uid()) = user_id);

-- Create a realtime publication to automatically stream Posts and Comments globally
drop publication if exists supabase_realtime;
create publication supabase_realtime for table public.posts, public.comments;

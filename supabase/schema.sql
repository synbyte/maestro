-- CREATE PROFILES TABLE
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  display_name text,
  cohort text default 'Cohort 8',
  role text default 'Student',
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on Row Level Security for profiles
alter table public.profiles enable row level security;

-- Profiles Policies
create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);
create policy "Users can insert their own profile." on profiles
  for insert with check ((select auth.uid()) = id);
create policy "Users can update own profile." on profiles
  for update using ((select auth.uid()) = id);

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

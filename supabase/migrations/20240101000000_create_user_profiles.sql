-- Create user profiles table
create table public.user_profiles (
  id uuid references auth.users on delete cascade not null primary key,
  display_name text,
  avatar_url text,
  top_artists jsonb,
  top_genres jsonb,
  mood_history jsonb,
  daily_mix jsonb,
  daily_mix_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.user_profiles enable row level security;

-- Create policies
create policy "Users can view their own profile."
  on public.user_profiles for select
  using ( auth.uid() = id );

create policy "Users can update their own profile."
  on public.user_profiles for update
  using ( auth.uid() = id );

create policy "Users can insert their own profile."
  on public.user_profiles for insert
  with check ( auth.uid() = id );

-- Function to handle new user signup
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.user_profiles (id, display_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;

-- Trigger to automatically create profile for new users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

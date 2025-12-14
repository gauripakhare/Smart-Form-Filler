-- Create profiles table for user management
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Create form_submissions table
create table if not exists public.form_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  form_type text not null,
  status text not null default 'draft',
  form_data jsonb not null default '{}'::jsonb,
  extracted_data jsonb default '{}'::jsonb,
  submission_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  submitted_at timestamp with time zone
);

alter table public.form_submissions enable row level security;

create policy "form_submissions_select_own"
  on public.form_submissions for select
  using (auth.uid() = user_id);

create policy "form_submissions_insert_own"
  on public.form_submissions for insert
  with check (auth.uid() = user_id);

create policy "form_submissions_update_own"
  on public.form_submissions for update
  using (auth.uid() = user_id);

create policy "form_submissions_delete_own"
  on public.form_submissions for delete
  using (auth.uid() = user_id);

-- Create documents table for uploaded files
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  form_submission_id uuid references public.form_submissions(id) on delete cascade,
  document_type text not null,
  file_url text not null,
  file_name text not null,
  file_size integer not null,
  extracted_text text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.documents enable row level security;

create policy "documents_select_own"
  on public.documents for select
  using (auth.uid() = user_id);

create policy "documents_insert_own"
  on public.documents for insert
  with check (auth.uid() = user_id);

create policy "documents_delete_own"
  on public.documents for delete
  using (auth.uid() = user_id);

-- Create trigger function for profile creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', null)
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

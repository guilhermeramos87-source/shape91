alter table public.profiles
  add column if not exists experience_level text not null default 'iniciante',
  add column if not exists training_location text not null default 'academia',
  add column if not exists focus_area text not null default 'corpo inteiro',
  add column if not exists cardio_preference text not null default 'caminhada',
  add column if not exists session_minutes integer not null default 45,
  add column if not exists targets_mode text not null default 'auto',
  add column if not exists custom_calories integer,
  add column if not exists custom_protein_g integer,
  add column if not exists custom_water_l numeric(4,2),
  add column if not exists custom_cardio_minutes integer,
  add column if not exists photo_url text,
  add column if not exists meals_per_day integer not null default 5,
  add column if not exists wake_time time,
  add column if not exists cardio_time time,
  add column if not exists breakfast_time time,
  add column if not exists lunch_time time,
  add column if not exists snack_time time,
  add column if not exists workout_time time,
  add column if not exists dinner_time time,
  add column if not exists sleep_time time,
  add column if not exists leave_home_time time,
  add column if not exists home_time time;

alter table public.daily_checkins
  add column if not exists calories_consumed integer,
  add column if not exists protein_consumed_g integer,
  add column if not exists cardio_minutes_done integer not null default 0;

alter table public.profiles enable row level security;
alter table public.daily_checkins enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can view own profile"
on public.profiles for select to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own profile"
on public.profiles for insert to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own profile"
on public.profiles for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can view own checkins" on public.daily_checkins;
drop policy if exists "Users can insert own checkins" on public.daily_checkins;
drop policy if exists "Users can update own checkins" on public.daily_checkins;
drop policy if exists "Users can delete own checkins" on public.daily_checkins;

create policy "Users can view own checkins"
on public.daily_checkins for select to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own checkins"
on public.daily_checkins for insert to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own checkins"
on public.daily_checkins for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own checkins"
on public.daily_checkins for delete to authenticated
using (auth.uid() = user_id);

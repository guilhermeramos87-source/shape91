alter table public.profiles
  add column if not exists food_restrictions text,
  add column if not exists food_preferences text,
  add column if not exists diet_style text not null default 'equilibrada';

-- Garante colunas anteriores
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

-- Run this once in the Supabase SQL editor for a brand-new project.
--
-- Already have a project from before (any earlier version of this app)?
-- Skip to the very bottom of this file for a copy-pasteable migration
-- block that only adds what's missing — safe to run more than once.

create extension if not exists "uuid-ossp";

-- One row per user, tracking their university window so the graduation
-- PDF knows what "4 years" means for them.
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  program text,
  start_date date,
  target_graduation_date date,
  created_at timestamptz not null default now()
);

do $$ begin
  create type task_category as enum (
    'daily', 'weekly', 'monthly', 'semester', 'yearly', 'before_graduation'
  );
exception when duplicate_object then null;
end $$;

create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category task_category not null,
  title text not null,
  notes text,

  -- Resolution: exactly one of these should end up true. completed is
  -- derived automatically for tasks with subtasks (see below) rather
  -- than toggled directly by the user in that case.
  completed boolean not null default false,
  completed_at timestamptz,
  failed boolean not null default false,
  failed_at timestamptz,
  excused boolean not null default false,        -- "couldn't complete due to special circumstances"
  excused_at timestamptz,
  excuse_note text,

  -- Filled in during the graduation-record review flow, for tasks left
  -- unresolved (not completed/failed/excused) once you're wrapping up.
  failure_note text,

  -- The date/time this task is actually FOR — separate from created_at,
  -- which is just when you typed it in. Lets you log something today
  -- for tomorrow's "daily", next month's "monthly", etc. Falls back to
  -- created_at when left blank.
  effective_date timestamptz,

  -- Single-mode deadline. Ignored (use subtasks.deadline instead) when
  -- deadline_mode = 'per_subtask'.
  deadline timestamptz,
  deadline_mode text not null default 'single' check (deadline_mode in ('single', 'per_subtask')),

  -- qualitative = plain checkbox. quantitative = you set a target at
  -- creation and log an actual result later; hitting the target is what
  -- marks it completed.
  task_type text not null default 'qualitative' check (task_type in ('qualitative', 'quantitative')),
  target_value text,
  result_value text,

  -- Hidden from the active list once resolved AND its period has ended
  -- (e.g. a completed daily task disappears after that day is over).
  -- Never deleted — the graduation PDF still includes archived tasks.
  archived boolean not null default false,

  -- Manual ordering within a category (lower = earlier). New tasks get
  -- appended with the current max + 1.
  order_index integer not null default 0,

  created_at timestamptz not null default now()
);

create table if not exists subtasks (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid not null references tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  completed boolean not null default false,
  completed_at timestamptz,
  deadline timestamptz, -- only used when the parent task's deadline_mode = 'per_subtask'
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists tasks_user_category_idx on tasks (user_id, category);
create index if not exists tasks_user_archived_idx on tasks (user_id, archived);
create index if not exists subtasks_task_idx on subtasks (task_id);

-- You define your own semester boundaries here (real academic calendars
-- vary too much to guess), and every "semester" task is labeled by
-- whichever range its effective date falls into.
create table if not exists semesters (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now()
);

create index if not exists semesters_user_idx on semesters (user_id);

alter table profiles enable row level security;
alter table tasks enable row level security;
alter table subtasks enable row level security;
alter table semesters enable row level security;

create policy "profiles: owner read" on profiles for select using (auth.uid() = id);
create policy "profiles: owner upsert" on profiles for insert with check (auth.uid() = id);
create policy "profiles: owner update" on profiles for update using (auth.uid() = id);

create policy "tasks: owner read" on tasks for select using (auth.uid() = user_id);
create policy "tasks: owner insert" on tasks for insert with check (auth.uid() = user_id);
create policy "tasks: owner update" on tasks for update using (auth.uid() = user_id);
create policy "tasks: owner delete" on tasks for delete using (auth.uid() = user_id);

create policy "subtasks: owner read" on subtasks for select using (auth.uid() = user_id);
create policy "subtasks: owner insert" on subtasks for insert with check (auth.uid() = user_id);
create policy "subtasks: owner update" on subtasks for update using (auth.uid() = user_id);
create policy "subtasks: owner delete" on subtasks for delete using (auth.uid() = user_id);

create policy "semesters: owner read" on semesters for select using (auth.uid() = user_id);
create policy "semesters: owner insert" on semesters for insert with check (auth.uid() = user_id);
create policy "semesters: owner update" on semesters for update using (auth.uid() = user_id);
create policy "semesters: owner delete" on semesters for delete using (auth.uid() = user_id);


-- =====================================================================
-- MIGRATION for an existing project (from any earlier version of this
-- app). Safe to run more than once — every statement is idempotent.
-- =====================================================================
--
-- alter table tasks add column if not exists effective_date timestamptz;
-- alter table tasks add column if not exists failure_note text;
-- alter table tasks add column if not exists failed boolean not null default false;
-- alter table tasks add column if not exists failed_at timestamptz;
-- alter table tasks add column if not exists excused boolean not null default false;
-- alter table tasks add column if not exists excused_at timestamptz;
-- alter table tasks add column if not exists excuse_note text;
-- alter table tasks add column if not exists deadline_mode text not null default 'single';
-- alter table tasks add column if not exists task_type text not null default 'qualitative';
-- alter table tasks add column if not exists target_value text;
-- alter table tasks add column if not exists result_value text;
-- alter table tasks add column if not exists archived boolean not null default false;
-- alter table tasks add column if not exists order_index integer not null default 0;
--
-- create table if not exists semesters (
--   id uuid primary key default uuid_generate_v4(),
--   user_id uuid not null references auth.users(id) on delete cascade,
--   label text not null,
--   start_date date not null,
--   end_date date not null,
--   created_at timestamptz not null default now()
-- );
-- alter table semesters enable row level security;
-- create policy "semesters: owner read" on semesters for select using (auth.uid() = user_id);
-- create policy "semesters: owner insert" on semesters for insert with check (auth.uid() = user_id);
-- create policy "semesters: owner update" on semesters for update using (auth.uid() = user_id);
-- create policy "semesters: owner delete" on semesters for delete using (auth.uid() = user_id);
--
-- create table if not exists subtasks (
--   id uuid primary key default uuid_generate_v4(),
--   task_id uuid not null references tasks(id) on delete cascade,
--   user_id uuid not null references auth.users(id) on delete cascade,
--   title text not null,
--   completed boolean not null default false,
--   completed_at timestamptz,
--   deadline timestamptz,
--   order_index integer not null default 0,
--   created_at timestamptz not null default now()
-- );
-- alter table subtasks enable row level security;
-- create policy "subtasks: owner read" on subtasks for select using (auth.uid() = user_id);
-- create policy "subtasks: owner insert" on subtasks for insert with check (auth.uid() = user_id);
-- create policy "subtasks: owner update" on subtasks for update using (auth.uid() = user_id);
-- create policy "subtasks: owner delete" on subtasks for delete using (auth.uid() = user_id);

-- =====================================================================
-- RE:Namaz module
-- =====================================================================

create table if not exists namaz_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  prayer text not null check (prayer in ('fajr','zuhr','asr','maghrib','isha')),
  date date not null,
  status text not null check (status in ('prayed','missed')),
  excused boolean not null default false,
  excuse_note text,
  created_at timestamptz not null default now(),
  unique (user_id, prayer, date)
);
create index if not exists namaz_logs_user_date_idx on namaz_logs (user_id, date);

create table if not exists namaz_qaza (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  prayer text not null check (prayer in ('fajr','zuhr','asr','maghrib','isha')),
  prayed_at timestamptz not null default now(),
  note text,
  created_at timestamptz not null default now()
);
create index if not exists namaz_qaza_user_idx on namaz_qaza (user_id);

alter table namaz_logs enable row level security;
alter table namaz_qaza enable row level security;

drop policy if exists "namaz_logs: owner read" on namaz_logs;
drop policy if exists "namaz_logs: owner insert" on namaz_logs;
drop policy if exists "namaz_logs: owner update" on namaz_logs;
drop policy if exists "namaz_logs: owner delete" on namaz_logs;
create policy "namaz_logs: owner read" on namaz_logs for select using (auth.uid() = user_id);
create policy "namaz_logs: owner insert" on namaz_logs for insert with check (auth.uid() = user_id);
create policy "namaz_logs: owner update" on namaz_logs for update using (auth.uid() = user_id);
create policy "namaz_logs: owner delete" on namaz_logs for delete using (auth.uid() = user_id);

drop policy if exists "namaz_qaza: owner read" on namaz_qaza;
drop policy if exists "namaz_qaza: owner insert" on namaz_qaza;
drop policy if exists "namaz_qaza: owner update" on namaz_qaza;
drop policy if exists "namaz_qaza: owner delete" on namaz_qaza;
create policy "namaz_qaza: owner read" on namaz_qaza for select using (auth.uid() = user_id);
create policy "namaz_qaza: owner insert" on namaz_qaza for insert with check (auth.uid() = user_id);
create policy "namaz_qaza: owner update" on namaz_qaza for update using (auth.uid() = user_id);
create policy "namaz_qaza: owner delete" on namaz_qaza for delete using (auth.uid() = user_id);

-- =====================================================================
-- RE:Calendar / RE:Study module
-- =====================================================================

create table if not exists courses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null,
  name text not null,
  color text not null default '#4A5A66',
  lecturer text,
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, code)
);

create table if not exists course_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  type text not null check (type in ('class','assessment','deadline','other')),
  title text not null,
  date date not null,
  start_time time,
  end_time time,
  location text,
  weight text,
  notes text,
  confirmed boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists course_events_user_date_idx on course_events (user_id, date);

alter table courses enable row level security;
alter table course_events enable row level security;

drop policy if exists "courses: owner read" on courses;
drop policy if exists "courses: owner insert" on courses;
drop policy if exists "courses: owner update" on courses;
drop policy if exists "courses: owner delete" on courses;
create policy "courses: owner read" on courses for select using (auth.uid() = user_id);
create policy "courses: owner insert" on courses for insert with check (auth.uid() = user_id);
create policy "courses: owner update" on courses for update using (auth.uid() = user_id);
create policy "courses: owner delete" on courses for delete using (auth.uid() = user_id);

drop policy if exists "course_events: owner read" on course_events;
drop policy if exists "course_events: owner insert" on course_events;
drop policy if exists "course_events: owner update" on course_events;
drop policy if exists "course_events: owner delete" on course_events;
create policy "course_events: owner read" on course_events for select using (auth.uid() = user_id);
create policy "course_events: owner insert" on course_events for insert with check (auth.uid() = user_id);
create policy "course_events: owner update" on course_events for update using (auth.uid() = user_id);
create policy "course_events: owner delete" on course_events for delete using (auth.uid() = user_id);

-- =====================================================================
-- RE:Habit module (replaces the scrapped RE:Calendar / RE:Study)
-- =====================================================================
-- If you ran the courses/course_events migration earlier, you can drop
-- those now (optional, no longer used):
--   drop table if exists course_events;
--   drop table if exists courses;

create table if not exists habits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  details text,
  interval_days integer not null check (interval_days > 0),
  start_date date not null default current_date,
  created_at timestamptz not null default now()
);

-- Only resolved occurrences are ever stored (done or missed). The
-- current/future occurrence is computed on the fly from interval_days
-- and start_date, and only written here once it's ticked done or its
-- window fully elapses without being ticked (= missed).
create table if not exists habit_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references habits(id) on delete cascade,
  occurrence_index integer not null,
  due_date date not null,
  status text not null check (status in ('done','missed')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (habit_id, occurrence_index)
);
create index if not exists habit_logs_habit_idx on habit_logs (habit_id);

alter table habits enable row level security;
alter table habit_logs enable row level security;

drop policy if exists "habits: owner read" on habits;
drop policy if exists "habits: owner insert" on habits;
drop policy if exists "habits: owner update" on habits;
drop policy if exists "habits: owner delete" on habits;
create policy "habits: owner read" on habits for select using (auth.uid() = user_id);
create policy "habits: owner insert" on habits for insert with check (auth.uid() = user_id);
create policy "habits: owner update" on habits for update using (auth.uid() = user_id);
create policy "habits: owner delete" on habits for delete using (auth.uid() = user_id);

drop policy if exists "habit_logs: owner read" on habit_logs;
drop policy if exists "habit_logs: owner insert" on habit_logs;
drop policy if exists "habit_logs: owner update" on habit_logs;
drop policy if exists "habit_logs: owner delete" on habit_logs;
create policy "habit_logs: owner read" on habit_logs for select using (auth.uid() = user_id);
create policy "habit_logs: owner insert" on habit_logs for insert with check (auth.uid() = user_id);
create policy "habit_logs: owner update" on habit_logs for update using (auth.uid() = user_id);
create policy "habit_logs: owner delete" on habit_logs for delete using (auth.uid() = user_id);

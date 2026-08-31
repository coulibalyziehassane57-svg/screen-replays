
-- ROLES
create type public.app_role as enum ('admin','user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "own roles readable" on public.user_roles for select to authenticated using (user_id = auth.uid());
create policy "admins manage roles" on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- UPDATED AT
create or replace function public.set_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

-- SPORTS
create table public.sports (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  emoji text not null default '🏅',
  description text,
  federation text,
  ruleset_version text,
  active boolean not null default true,
  position int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.sports to anon, authenticated;
grant all on public.sports to service_role;
alter table public.sports enable row level security;
create policy "sports public read" on public.sports for select using (true);
create policy "sports admin write" on public.sports for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- LESSONS
create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  sport_id uuid not null references public.sports(id) on delete cascade,
  position int not null,
  title text not null,
  summary text,
  content text not null,
  examples jsonb not null default '[]'::jsonb,
  situations jsonb not null default '[]'::jsonb,
  level text not null default 'debutant',
  federation text,
  ruleset_version text,
  xp_reward int not null default 50,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sport_id, position)
);
grant select on public.lessons to anon, authenticated;
grant all on public.lessons to service_role;
alter table public.lessons enable row level security;
create policy "lessons public read" on public.lessons for select using (true);
create policy "lessons admin write" on public.lessons for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger lessons_updated before update on public.lessons for each row execute function public.set_updated_at();

-- QUESTIONS
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  sport_id uuid not null references public.sports(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete cascade,
  prompt text not null,
  choices jsonb not null,
  correct_index int not null,
  explanation text not null,
  skill text not null default 'regles',
  difficulty int not null default 1,
  federation text,
  ruleset_version text,
  created_at timestamptz not null default now()
);
grant select on public.questions to anon, authenticated;
grant all on public.questions to service_role;
alter table public.questions enable row level security;
create policy "questions public read" on public.questions for select using (true);
create policy "questions admin write" on public.questions for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- GESTURES
create table public.gestures (
  id uuid primary key default gen_random_uuid(),
  sport_id uuid not null references public.sports(id) on delete cascade,
  name text not null,
  meaning text not null,
  situation text not null,
  sanction text,
  restart text,
  whistle text,
  whistle_count int,
  common_errors text,
  image_url text,
  audio_url text,
  federation text,
  ruleset_version text,
  created_at timestamptz not null default now()
);
grant select on public.gestures to anon, authenticated;
grant all on public.gestures to service_role;
alter table public.gestures enable row level security;
create policy "gestures public read" on public.gestures for select using (true);
create policy "gestures admin write" on public.gestures for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- SCENARIOS
create table public.scenarios (
  id uuid primary key default gen_random_uuid(),
  sport_id uuid not null references public.sports(id) on delete cascade,
  level text not null default 'debutant',
  difficulty int not null default 1,
  theme text,
  situation text not null,
  options jsonb not null,
  correct_index int not null,
  explanation text not null,
  wrong_explanations jsonb not null default '[]'::jsonb,
  gesture_id uuid references public.gestures(id) on delete set null,
  federation text,
  ruleset_version text,
  created_at timestamptz not null default now()
);
grant select on public.scenarios to anon, authenticated;
grant all on public.scenarios to service_role;
alter table public.scenarios enable row level security;
create policy "scenarios public read" on public.scenarios for select using (true);
create policy "scenarios admin write" on public.scenarios for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- BADGES
create table public.badges (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text not null,
  emoji text not null default '🏆',
  created_at timestamptz not null default now()
);
grant select on public.badges to anon, authenticated;
grant all on public.badges to service_role;
alter table public.badges enable row level security;
create policy "badges public read" on public.badges for select using (true);
create policy "badges admin write" on public.badges for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- SETTINGS
create table public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
grant select on public.app_settings to anon, authenticated;
grant all on public.app_settings to service_role;
alter table public.app_settings enable row level security;
create policy "settings public read" on public.app_settings for select using (true);
create policy "settings admin write" on public.app_settings for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Arbitre',
  country text,
  level text not null default 'debutant',
  xp int not null default 0,
  streak_days int not null default 0,
  last_active_date date,
  hidden_from_leaderboard boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant select on public.profiles to anon;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles readable when visible" on public.profiles for select using (not hidden_from_leaderboard or id = auth.uid());
create policy "profiles insert own" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "profiles update own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1), 'Arbitre'))
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'user') on conflict do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- USER SPORTS
create table public.user_sports (
  user_id uuid not null references auth.users(id) on delete cascade,
  sport_id uuid not null references public.sports(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, sport_id)
);
grant select, insert, delete on public.user_sports to authenticated;
grant all on public.user_sports to service_role;
alter table public.user_sports enable row level security;
create policy "own sports" on public.user_sports for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- LESSON PROGRESS
create table public.lesson_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed boolean not null default false,
  best_score int not null default 0,
  attempts int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);
grant select, insert, update on public.lesson_progress to authenticated;
grant all on public.lesson_progress to service_role;
alter table public.lesson_progress enable row level security;
create policy "own lesson progress" on public.lesson_progress for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create trigger lesson_progress_updated before update on public.lesson_progress for each row execute function public.set_updated_at();

-- QUIZ ATTEMPTS
create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  score int not null,
  total int not null,
  passed boolean not null,
  wrong_question_ids jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
grant select, insert on public.quiz_attempts to authenticated;
grant all on public.quiz_attempts to service_role;
alter table public.quiz_attempts enable row level security;
create policy "own quiz attempts" on public.quiz_attempts for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- SCENARIO ATTEMPTS
create table public.scenario_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scenario_id uuid not null references public.scenarios(id) on delete cascade,
  correct boolean not null,
  decision_ms int not null default 0,
  created_at timestamptz not null default now()
);
grant select, insert on public.scenario_attempts to authenticated;
grant all on public.scenario_attempts to service_role;
alter table public.scenario_attempts enable row level security;
create policy "own scenario attempts" on public.scenario_attempts for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- USER BADGES
create table public.user_badges (
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);
grant select, insert on public.user_badges to authenticated;
grant all on public.user_badges to service_role;
alter table public.user_badges enable row level security;
create policy "own badges read" on public.user_badges for select to authenticated using (user_id = auth.uid());
create policy "own badges insert" on public.user_badges for insert to authenticated with check (user_id = auth.uid());

-- SEED SETTINGS + BADGES
insert into public.app_settings (key, value) values ('quiz_pass_threshold', '8'::jsonb), ('quiz_length', '10'::jsonb);
insert into public.badges (code, name, description, emoji) values
  ('first_lesson','Premier coup de sifflet','Valider sa première leçon','🎉'),
  ('five_lessons','Arbitre assidu','Valider 5 leçons','📚'),
  ('perfect_quiz','Sans faute','Obtenir 10/10 à un quiz','💯'),
  ('simulator_10','Décideur','Réussir 10 situations au simulateur','⚡');

-- SEED SPORTS
insert into public.sports (slug, name, emoji, description, federation, ruleset_version, position) values
  ('football','Football','⚽','Lois du jeu et arbitrage à 11','IFAB','Lois du Jeu 2024/25',1),
  ('basketball','Basketball','🏀','Règles officielles et signaux de table','FIBA','Règles officielles 2022',2),
  ('volleyball','Volleyball','🏐','Règles de jeu et gestes officiels','FIVB','Règles 2021-2024',3),
  ('handball','Handball','🤾','Règles de jeu et gestuelle','IHF','Règles 2022',4),
  ('rugby','Rugby à XV','🏉','Règles du jeu','World Rugby','Règles 2024',5),
  ('tennis','Tennis','🎾','Règles et arbitrage de chaise','ITF','Rules of Tennis 2024',6),
  ('tennis-de-table','Tennis de table','🏓','Règlement et arbitrage','ITTF','Handbook 2024',7),
  ('badminton','Badminton','🏸','Lois du badminton','BWF','Laws of Badminton 2024',8),
  ('judo','Judo','🥋','Règlement d''arbitrage','IJF','Règles 2022-2024',9),
  ('boxe','Boxe','🥊','Règlement et arbitrage','World Boxing','Règles techniques',10),
  ('hockey','Hockey sur glace','🏒','Règles officielles','IIHF','Rule Book 2023-26',11),
  ('baseball','Baseball','⚾','Règles officielles','WBSC','Official Rules',12),
  ('natation','Natation','🏊','Règlement des courses','World Aquatics','Swimming Rules',13),
  ('athletisme','Athlétisme','🏃','Règles de compétition','World Athletics','Technical Rules',14);

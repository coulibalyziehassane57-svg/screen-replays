import { supabase } from "@/integrations/supabase/client";

export const LEVELS = [
  { value: "debutant", label: "Débutant" },
  { value: "amateur", label: "Amateur" },
  { value: "confirme", label: "Confirmé" },
  { value: "expert", label: "Expert" },
] as const;

export const SKILLS: Record<string, string> = {
  regles: "Règles",
  decision: "Décision",
  gestes: "Gestes",
  sifflets: "Sifflets",
  complexe: "Situations complexes",
};

export type Sport = {
  id: string;
  slug: string;
  name: string;
  emoji: string;
  description: string | null;
  federation: string | null;
  ruleset_version: string | null;
  position: number;
};

export type Lesson = {
  id: string;
  sport_id: string;
  position: number;
  title: string;
  summary: string | null;
  content: string;
  examples: string[];
  situations: string[];
  level: string;
  federation: string | null;
  ruleset_version: string | null;
  xp_reward: number;
};

export type Question = {
  id: string;
  prompt: string;
  choices: string[];
  correct_index: number;
  explanation: string;
  skill: string;
};

export type Gesture = {
  id: string;
  sport_id: string;
  name: string;
  meaning: string;
  situation: string;
  sanction: string | null;
  restart: string | null;
  whistle: string | null;
  whistle_count: number | null;
  common_errors: string | null;
  federation: string | null;
  ruleset_version: string | null;
};

export type Scenario = {
  id: string;
  sport_id: string;
  level: string;
  difficulty: number;
  theme: string | null;
  situation: string;
  options: string[];
  correct_index: number;
  explanation: string;
  wrong_explanations: string[];
  federation: string | null;
};

export async function fetchSports() {
  const { data, error } = await supabase.from("sports").select("*").eq("active", true).order("position");
  if (error) throw error;
  return (data ?? []) as unknown as Sport[];
}

export async function fetchSportBySlug(slug: string) {
  const { data, error } = await supabase.from("sports").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return (data ?? null) as unknown as Sport | null;
}

export async function fetchLessons(sportId: string) {
  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .eq("sport_id", sportId)
    .order("position");
  if (error) throw error;
  return (data ?? []) as unknown as Lesson[];
}

export async function fetchLesson(lessonId: string) {
  const { data, error } = await supabase.from("lessons").select("*").eq("id", lessonId).maybeSingle();
  if (error) throw error;
  return (data ?? null) as unknown as Lesson | null;
}

export async function fetchQuestions(lessonId: string) {
  const { data, error } = await supabase.from("questions").select("*").eq("lesson_id", lessonId);
  if (error) throw error;
  return (data ?? []) as unknown as Question[];
}

export async function fetchGestures(sportId: string) {
  const { data, error } = await supabase.from("gestures").select("*").eq("sport_id", sportId).order("name");
  if (error) throw error;
  return (data ?? []) as unknown as Gesture[];
}

export async function fetchScenarios(sportId: string, level?: string) {
  let query = supabase.from("scenarios").select("*").eq("sport_id", sportId);
  if (level) query = query.eq("level", level);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as Scenario[];
}

export async function fetchSetting(key: string, fallback: number) {
  const { data, error } = await supabase.from("app_settings").select("value").eq("key", key).maybeSingle();
  if (error) throw error;
  const value = data?.value;
  return typeof value === "number" ? value : fallback;
}

export async function fetchProfile(userId: string) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchLessonProgress(userId: string) {
  const { data, error } = await supabase
    .from("lesson_progress")
    .select("lesson_id, completed, best_score, attempts")
    .eq("user_id", userId);
  if (error) throw error;
  return data ?? [];
}

export async function addXp(userId: string, amount: number) {
  const { data } = await supabase.from("profiles").select("xp, streak_days, last_active_date").eq("id", userId).maybeSingle();
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const last = data?.last_active_date ?? null;
  const streak = last === today ? (data?.streak_days ?? 1) : last === yesterday ? (data?.streak_days ?? 0) + 1 : 1;
  await supabase
    .from("profiles")
    .update({ xp: (data?.xp ?? 0) + amount, streak_days: streak, last_active_date: today })
    .eq("id", userId);
}

export async function grantBadge(userId: string, code: string) {
  const { data } = await supabase.from("badges").select("id").eq("code", code).maybeSingle();
  if (!data) return;
  await supabase.from("user_badges").upsert({ user_id: userId, badge_id: data.id }, { onConflict: "user_id,badge_id" });
}

export function levelFromXp(xp: number) {
  return Math.floor(xp / 500) + 1;
}

export function xpProgressInLevel(xp: number) {
  return Math.round(((xp % 500) / 500) * 100);
}

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}
